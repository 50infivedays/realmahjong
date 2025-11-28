# 简化麻将 AI 算法设计文档（参考 AlphaJong 思路）

> 目标：实现一个**不计分数、只追求胡牌**的简化麻将 AI，支持吃 / 碰 / 杠决策和手牌处理，并可通过参数控制进攻 / 防守风格与模拟深度。

---

## 1. 设计目标与前提假设

### 1.1 目标

实现一个简化麻将 AI：

1. 在每个决策点（摸牌后打牌、别人打牌我是否吃碰杠）时，选择一个动作。
2. 动作评价只看：**它对未来胡牌概率的影响**（不看番数与得点）。
3. 支持「风格化」参数，使得 AI 可以：
   - 更「进攻」：积极吃碰杠、快速成和；
   - 更「防守」：减少副露、优先安全打牌；
   - 并通过「模拟深度 / 次数」控制思考量。

### 1.2 规则简化假设

为专注于算法，规则层做如下简化（可根据实际再扩展）：

- 使用标准的 **4 副面子 + 1 将** 胡牌结构。
- 是否支持七对子、国士等特殊和型由「胡牌判定函数」自行扩展。
- 默认 4 人麻将（3 麻可在此基础上扩展）。
- 暂不实现立直、宝牌、点数结算。
- 防守仅做粗略「危险度评分」，不精确计算放炮概率。

---

## 2. 整体架构概览

核心模块划分如下：

1. **State（局面表示）**
2. **Rule Engine（规则引擎：生成合法动作）**
3. **Hand Evaluator（手牌评价：向听数 / 缺张数）**
4. **Simulator（模拟器：面向胡牌的随机模拟）**
5. **Policy / Scoring（策略与评分）**
6. **Style Config（风格配置参数）**

### 2.1 State（局面表示）

伪结构示意：

```text
State {
  tiles_wall_remaining: int                // 牌山剩余张数（或更详细的牌向量）
  my_hand: TileMultiset                    // 自己手牌（多重集）
  my_melds: list<Meld>                     // 吃 / 碰 / 杠 副露
  my_discards: list<Tile>                  // 自己打出的牌

  opponents: list<OpponentState>           // 其它 3 家的公开信息
  current_player: PlayerId                 // 当前行动玩家
  round_info: {
    dealer: PlayerId
    round_wind: Wind
    player_winds: [Wind, Wind, Wind, Wind]
    honba_count: int
  }
}
```

对手信息可简化为：

```text
OpponentState {
  melds: list<Meld>
  discards: list<Tile>
  // 可拓展：是否立直、副露数量等
}
```

> 对手的**实际手牌与牌山剩余**可在模拟阶段按概率 / 随机方式补全。

### 2.2 Action（动作表示）

```text
Action {
  type: enum { DISCARD, CHI, PON, KAN, WIN, PASS }
  tile_or_pattern: // 打出的牌，或吃/碰/杠时使用的牌型
}
```

---

## 3. 手牌进度评价：向听数 / 胡牌距离

即使不计分，仍需度量「距离胡牌有多远」。

### 3.1 向听数函数

核心接口：

```text
int shanten(Hand hand, list<Meld> open_melds)
```

约定：

- 返回整数 `s >= 0`：
  - `0`：听牌 / 已是和型；
  - `1`：还差 1 张（两向听）；
  - 数字越大离胡越远。
- 若要支持七对子、国士无双等，增加相应模式并取最小向听数。

### 3.2 使用方式

在每次决策时：

1. 计算当前局面的 `shanten_before = shanten(my_hand, my_melds)`。
2. 对每个候选动作 `a`：
   - 应用 `a` 到复制后的局面；
   - 计算 `shanten_after`；
   - 若 `shanten_after < shanten_before`，说明该动作在「静态上」缩短了胡牌距离。

后续在评分函数里，会将向听数变化与模拟结果结合起来。

---

## 4. 动作生成（Rule Engine）

根据当前局面生成所有合法动作。

### 4.1 自摸回合（轮到自己摸牌）

候选动作：

- **打牌**：
  - 对自己手牌中的每张牌 `tile`，生成：
    ```text
    Action{ type: DISCARD, tile_or_pattern: tile }
    ```
- **自摸和**（已成和牌结构）：
  - 若满足胡牌判定，生成：
    ```text
    Action{ type: WIN }
    ```
- **暗杠 / 加杠**（可选）：
  - 若手牌中有 4 张相同牌，或已有碰可加杠，则加入对应 `KAN` 动作。

### 4.2 他家打牌后（回应：吃碰杠 / 荣和 / PASS）

当某个对手打出一张牌 `T` 时，检查自己是否可以：

- **荣和**：
  - 若加上 `T` 能胡牌，生成 `WIN`。
- **碰**：
  - 手牌中有 2 张 `T`。
- **杠**：
  - 手牌中有 3 张 `T`。
- **吃**（仅对下家）：
  - 手牌中存在可与 `T` 组成顺子的两张牌。

此外，永远包含一个：

```text
Action{ type: PASS }
```

在评分时由风格参数（吃碰杠积极性）来调节是否选择这些副露动作。

---

## 5. 模拟器（Simulator）设计

参考 AlphaJong 的思想：**对每个候选动作，模拟后续若干回合，估计该动作带来的胡牌机会与风险。**

### 5.1 模拟思路

对每个 action：

1. 拷贝当前 `state` 为 `sim_state`。
2. 在 `sim_state` 上应用该 action。
3. 若已胡牌，则直接给出极高评分，或者立即返回该动作。
4. 随机补全牌山与对手手牌：
   - 从剩余未知牌中，为每个对手分配合理数量的牌；
   - 留下牌山用于后续摸牌。
5. 在限定的步数 `max_depth` 内运行随机对局模拟：
   - 轮流摸牌 / 打牌；
   - 自己的出牌可采用简单贪心策略（例如打出不增加向听数甚至降低危险度的牌）；
   - 对手的出牌可以是随机或简单规则；
   - 记录模拟中是否胡牌、最小向听数、打出的危险牌等信息。

### 5.2 模拟伪代码

```text
simulate(sim_state, max_depth):

  shanten0 = shanten(sim_state.my_hand, sim_state.my_melds)
  min_shanten = shanten0
  danger = 0

  for step in 1..max_depth:
      if sim_state.tiles_wall_remaining == 0:
          break  // 流局

      current = sim_state.current_player

      if current == ME:
          action = greedy_self_action(sim_state)

          apply(action, sim_state)

          if action.type == DISCARD:
              danger += danger_of_discard(action.tile_or_pattern, sim_state)

          cur_shanten = shanten(sim_state.my_hand, sim_state.my_melds)
          if cur_shanten < min_shanten:
              min_shanten = cur_shanten

          if is_win(sim_state.my_hand, sim_state.my_melds):
              return { win: true, min_shanten, danger }
      else:
          opp_action = random_opponent_action(sim_state)
          apply(opp_action, sim_state)

          if opponent_win(sim_state):
              break   // 可以在这里结束模拟，视设计而定

  return { win: false, min_shanten, danger }
```

说明：

- `greedy_self_action` 可简单实现为：
  - 对每个可能打出的牌计算向听数变化；
  - 尽量选择不升高甚至降低向听数的打牌；
  - 若相同，再考虑危险度。
- `danger_of_discard` 是一个启发式函数，用于给每张丢出的牌评估「放炮风险」（越危险危险值越高）。

---

## 6. 风格化参数（Style Config）

通过配置参数调整 AI 的「思考量」和「打牌风格」。

### 6.1 参数结构

```text
Config {
  sim_depth: int              // 单次模拟的最大步数，例如 10~40
  sim_count: int              // 每个动作的模拟次数，例如 50~500

  attack_bias: float          // [0,1]，越大越偏向进攻（追胡牌）
  defense_bias: float         // [0,1]，越大越偏向防守（追安全）
                              // 通常可设置 attack_bias + defense_bias = 1

  call_aggressiveness: float  // [0,1]，吃碰杠积极性，值越大越爱副露
}
```

直观解释：

- **sim_depth / sim_count**：
  - 越大，AI 越「深思熟虑」但越慢；
  - 越小，决策更快但可能更粗糙。
- **attack_bias vs defense_bias**：
  - attack 高：更看重胡牌概率与速度；
  - defense 高：更看重打出去的牌是否安全。
- **call_aggressiveness**：
  - 高：更愿意吃碰杠，只要能明显加速胡牌就会积极副露；
  - 低：倾向门清，除非副露能显著改善向听数，否则宁愿 PASS。

---

## 7. 评分函数设计（Score(action)）

### 7.1 从模拟结果到统计量

对某个动作 `a`：

- 运行 `N = sim_count` 次 `simulate`，得到：
  - `wins`：胡牌次数；
  - `sum_min_shanten`：所有模拟中 `min_shanten` 之和；
  - `sum_danger`：所有模拟中 `danger` 之和。

计算统计值：

```text
estimated_win_rate = wins / N
avg_min_shanten    = sum_min_shanten / N
avg_danger         = sum_danger / N
```

再将其归一化到 [0,1] 区间，例如：

```text
progress_score = exp(-k * avg_min_shanten)  // 向听数越小，分数越高
safety_score   = exp(-c * avg_danger)       // 危险度越低，分数越高
```

其中 `k`、`c` 为可调常数。

### 7.2 进攻 / 防守合成

```text
offense_part = α1 * estimated_win_rate + α2 * progress_score
defense_part = safety_score

Score_base = config.attack_bias  * offense_part
           + config.defense_bias * defense_part
```

一般可设：

- 偏进攻：`attack_bias = 0.8, defense_bias = 0.2`
- 偏防守：`attack_bias = 0.3, defense_bias = 0.7`

### 7.3 吃碰杠偏好

对于 `CHI / PON / KAN` 动作，再加一个「副露偏好加成」：

```text
if action.type in {CHI, PON, KAN}:
    shanten_before = shanten(original_state.my_hand, original_state.my_melds)
    shanten_after  = shanten(post_action_state.my_hand, post_action_state.my_melds)
    delta_shanten  = shanten_before - shanten_after

    call_value = sigmoid(delta_shanten)              // 向听改善越多，值越大
    call_bonus = config.call_aggressiveness * call_value

    Score_final = Score_base + call_bonus
else:
    Score_final = Score_base
```

这样：

- `call_aggressiveness` 高：只要吃碰杠能显著减少向听数，就会得到明显加分；
- `call_aggressiveness` 低：即使略微改善向听数，也不一定能战胜门清打法。

---

## 8. 决策主流程伪代码

综合以上模块，整体决策流程如下：

```text
choose_action(state, config):

  actions = generate_legal_actions(state)

  // 1. 若存在必和动作，直接选
  for a in actions:
      if a.type == WIN:
          return a

  shanten_before = shanten(state.my_hand, state.my_melds)

  best_action = None
  best_score = -INF

  for action in actions:

      // 2. 拷贝状态并应用该动作
      base_sim_state = state.copy()
      apply(action, base_sim_state)

      // 若动作本身已成和牌，可直接选择或给极高分数
      if is_win(base_sim_state.my_hand, base_sim_state.my_melds):
          return action

      // 3. 多次随机模拟
      wins = 0
      sum_min_shanten = 0
      sum_danger = 0

      for i in 1..config.sim_count:
          // 随机补全部分隐藏信息
          sim_state = base_sim_state.copy()
          init_hidden_tiles_randomly(sim_state)

          result = simulate(sim_state, config.sim_depth)

          if result.win:
              wins += 1
          sum_min_shanten += result.min_shanten
          sum_danger      += result.danger

      // 4. 统计值 → 评分
      N = config.sim_count

      estimated_win_rate = wins / N
      avg_min_shanten    = sum_min_shanten / N
      avg_danger         = sum_danger / N

      progress_score = exp(-k * avg_min_shanten)
      safety_score   = exp(-c * avg_danger)

      offense_part = α1 * estimated_win_rate + α2 * progress_score
      defense_part = safety_score

      Score_base = config.attack_bias  * offense_part
                 + config.defense_bias * defense_part

      // 5. 吃碰杠偏好加成
      if action.type in {CHI, PON, KAN}:
          shanten_after = shanten(base_sim_state.my_hand, base_sim_state.my_melds)
          delta_shanten = shanten_before - shanten_after
          call_value = sigmoid(delta_shanten)
          call_bonus = config.call_aggressiveness * call_value
          score = Score_base + call_bonus
      else:
          score = Score_base

      // 6. 维护最佳动作
      if score > best_score:
          best_score = score
          best_action = action

  return best_action
```

---

## 9. 可扩展与优化建议

在上述基础上，可逐步进行以下扩展与优化：

1. **更高效的向听数算法**  
   - 使用高效的缺张数 / 向听数计算，减少每次评估时间。
2. **更精细的危险度模型**  
   - 根据对手副露情况、场风 /自风、牌河信息估算各牌危险度。
3. **阶段性策略调整**  
   - 根据「巡目」和「牌山剩余数量」，动态调整进攻 / 防守倾向。
4. **性能优化**  
   - 减少模拟次数、应用剪枝、缓存相同手牌配置的评估结果。

---

## 10. 小结

本设计文档给出了一个参考 AlphaJong 思路、但面向「简化麻将」的 AI 框架：

- 使用 **向听数** 作为胡牌进度核心指标；
- 通过 **模拟 + 启发式评分** 来评估不同动作对胡牌概率与安全性的影响；
- 用 **风格化参数（模拟深度、攻守比重、吃碰杠积极性）** 调整 AI 行为风格；
- 不关心番数与得点，仅以「最终胡牌」为主要目标。

你可以在此基础上选择具体语言（如 TypeScript / JavaScript / Python）实现，并逐步增加复杂规则或优化性能。
