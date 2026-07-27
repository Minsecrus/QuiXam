import type { Paper } from '../../types'
import { basePaper, createSection, question } from '../paperFactory'

const staticImage = (name: string, widthPercent: number, align: 'center' | 'right' = 'center') => [
  {
    assetId: `static:/papers/simulated/${name}.svg`,
    widthPercent,
    align,
  },
]

/**
 * 高中学业水平选择性考试结构模拟卷（原创，非真题）。
 *
 * 题量与分值按常见 75 分钟、100 分物理选择性考试组织：
 * 7 道单选 + 3 道多选 + 2 道实验题 + 3 道计算题。
 * 本卷用于验证物理公式、实验图、计算题和空白答题区的排版能力。
 */
export function simulatedPhysicsPaper(): Paper {
  const paper = basePaper('高考结构模拟卷·物理（非真题）', '物理', 75)
  paper.info.school = '高中学业水平选择性考试结构模拟（非真题）'
  paper.info.fullScore = 100
  paper.info.notices = [
    '答题前，考生务必将姓名、准考证号填写在答题卡上。',
    '选择题答案须按要求填涂在答题卡上；非选择题须写出必要的文字说明、方程式和演算步骤。',
    '本卷为 QuiXam 原创排版测试卷，不是历年高考真题。',
  ]
  paper.sections = [
    {
      ...createSection(
        '单项选择题',
        '本题共7小题，每小题4分，共28分。在每小题给出的四个选项中，只有一项符合题目要求。',
      ),
      questions: [
        question({
          type: 'single',
          stem: '体操运动员静止悬吊在两个吊环之间，可将两臂视为等长轻杆。运动员缓慢下移，使每只手臂与水平方向的夹角逐渐增大。在此过程中，每只手臂对躯干的作用力',
          score: 4,
          options: ['保持不变', '逐渐增大', '逐渐减小', '先增大后减小'],
          answer: 'C',
        }),
        question({
          type: 'single',
          stem: '某车沿直线运动的位移 $x$ 随时间 $t$ 的变化如图1所示：$0\\sim t_1$ 图线斜率逐渐增大，$t_1\\sim t_2$ 为直线，$t_2$ 后图线斜率逐渐减小。下列判断正确的是',
          score: 4,
          options: [
            '三个阶段的加速度依次为正、零、负',
            '三个阶段的速度均保持不变',
            '$t_1\\sim t_2$ 阶段汽车处于静止状态',
            '$t_2$ 后汽车一定沿反方向运动',
          ],
          answer: 'A',
          images: staticImage('physics-motion', 72),
        }),
        question({
          type: 'single',
          stem: '图示 LC 振荡电路中，$u_{ab}$ 随时间按正弦规律变化。在某段时间内电路的磁场能增大，且电容器 b 板带正电，则该时段可能是',
          score: 4,
          options: ['$0\\sim t_1$', '$t_1\\sim t_2$', '$t_2\\sim t_3$', '$t_3\\sim t_4$'],
          answer: 'D',
          images: staticImage('physics-lc', 70),
        }),
        question({
          type: 'single',
          stem: '机械臂夹持质量为 $10\\,\\mathrm{kg}$ 的工件，使其以 $7.5\\,\\mathrm{m/s^2}$ 的加速度沿水平方向运动。取 $g=10\\,\\mathrm{m/s^2}$，忽略空气阻力，机械臂对工件的作用力大小为',
          score: 4,
          options: ['$75\\,\\mathrm N$', '$100\\,\\mathrm N$', '$125\\,\\mathrm N$', '$175\\,\\mathrm N$'],
          answer: 'C',
        }),
        question({
          type: 'single',
          stem: '两根平行长直导线垂直纸面放置，通有大小相等、方向相同的恒定电流。关于两导线连线中点处的磁场，下列说法正确的是',
          score: 4,
          options: [
            '磁感应强度为零',
            '磁场方向垂直两导线连线向上',
            '磁场方向垂直两导线连线向下',
            '仅将一根导线电流反向后，中点磁场仍为零',
          ],
          answer: 'A',
        }),
        question({
          type: 'single',
          stem: '从同一点水平抛出两个小球，分别击中竖直墙上相距 $3L$ 的 P、Q 两点，P 点比抛出点低 $L$，Q 点比抛出点低 $4L$。两球击中墙时速率相等，不计空气阻力，则抛出点到墙的水平距离为',
          score: 4,
          options: ['$3L$', '$4L$', '$5L$', '$6L$'],
          answer: 'B',
        }),
        question({
          type: 'single',
          stem: '质量为 $1\\,\\mathrm{kg}$ 的物块在粗糙水平面上由静止开始运动。其动能 $E_k$ 与位移 $s$ 的关系如图2：$0\\sim s_0$ 图线斜率为 $12\\,\\mathrm N$，$s_0\\sim2s_0$ 图线斜率为 $-4\\,\\mathrm N$。若前一阶段物块受恒定水平拉力，后一阶段撤去拉力，则拉力大小为',
          score: 4,
          options: ['$8\\,\\mathrm N$', '$12\\,\\mathrm N$', '$16\\,\\mathrm N$', '$20\\,\\mathrm N$'],
          answer: 'C',
          images: staticImage('physics-motion', 72),
        }),
      ],
    },
    {
      ...createSection(
        '多项选择题',
        '本题共3小题，每小题5分，共15分。全部选对得5分，选对但不全得3分，有选错得0分。',
      ),
      questions: [
        question({
          type: 'multiple',
          stem: '理想变压器原线圈接有效值为 $U$ 的正弦交流电，副线圈并联两只额定电压均为 $2U$、额定功率分别为 $2P_0$ 和 $P_0$ 的灯泡。两灯均正常发光，则',
          score: 5,
          options: [
            '两灯电流之比为 $2:1$',
            '灯泡两端电压最大值为 $2\\sqrt2U$',
            '原、副线圈匝数之比为 $1:2$',
            '原、副线圈电流之比为 $1:2$',
          ],
          answer: 'ABC',
          images: staticImage('physics-transformer', 64),
        }),
        question({
          type: 'multiple',
          stem: '卫星 A、B 均绕同一行星做匀速圆周运动，A 的轨道半径为 $R$、周期为 $T$，B 的轨道半径为 $4R$。忽略卫星间相互作用，则 B 卫星',
          score: 5,
          options: [
            '周期为 $8T$',
            '线速度为 A 的 $\\dfrac12$',
            '向心加速度为 A 的 $\\dfrac1{16}$',
            '机械能为 A 的 $\\dfrac14$',
          ],
          answer: 'ABC',
        }),
        question({
          type: 'multiple',
          stem: '带正电微粒质量为 $m$、电荷量为 $q$，处在竖直方向的匀强电场中。$0\\sim t_0$ 内电场力竖直向上且大小为 $2mg$，$t_0\\sim2t_0$ 内电场撤去。微粒从静止释放，忽略空气阻力，则',
          score: 5,
          options: [
            '微粒最大速率为 $gt_0$',
            '$2t_0$ 时微粒回到释放点',
            '$0\\sim2t_0$ 内合外力的总冲量为零',
            '$0\\sim2t_0$ 内电场力冲量大小为 $2mgt_0$',
          ],
          answer: 'ACD',
        }),
      ],
    },
    {
      ...createSection('非选择题', '本题共5小题，共57分。'),
      questions: [
        question({
          type: 'solution',
          stem: '某同学用图示电路研究电动机的能量转化。电动机线圈电阻为 $8.0\\,\\Omega$，提升物体的总重力为 $1.5\\,\\mathrm N$。正常工作时电压表读数为 $3.0\\,\\mathrm V$，电流表读数为 $0.10\\,\\mathrm A$；位置传感器记录物体在 $4.0\\,\\mathrm s$ 内匀速上升 $0.12\\,\\mathrm m$。\n（1）求物体上升的速度；\n（2）求电动机的热功率、机械功率和效率；\n（3）说明实验中至少一种会导致效率测量出现偏差的因素。',
          score: 7,
          answer: '$v=3.0\\times10^{-2}\\,\\mathrm{m/s}$；热功率 $P_h=0.080\\,\\mathrm W$，机械功率 $P_m=0.045\\,\\mathrm W$，$\\eta=15\\%$。',
          answerLines: 0,
          images: staticImage('physics-experiment', 78),
        }),
        question({
          type: 'solution',
          stem: '用气垫导轨、光电门和带遮光片的滑块探究合外力与加速度的关系。遮光片宽度为 $d$，滑块从静止开始做匀加速直线运动，释放点到光电门的距离为 $x$，遮光时间为 $\\Delta t$。\n（1）写出滑块通过光电门时速度的近似表达式；\n（2）写出加速度的表达式；\n（3）若改变砝码质量后作出的 $a-F$ 图像不过原点，分析一种可能原因。',
          score: 9,
          answer: '$v=\\dfrac d{\\Delta t}$；$a=\\dfrac{d^2}{2x(\\Delta t)^2}$；可能存在阻力或力传感器未调零。',
          answerLines: 0,
        }),
        question({
          type: 'calculation',
          stem: '质量为 $3.0\\times10^3\\,\\mathrm{kg}$ 的返回舱在着陆前最后 $1.0\\,\\mathrm m$ 内，四台相同反推发动机同时点火，使返回舱的速度由竖直向下 $8.0\\,\\mathrm{m/s}$ 匀减速到 $1.0\\,\\mathrm{m/s}$。取 $g=10\\,\\mathrm{m/s^2}$，忽略其他阻力。\n（1）求返回舱加速度的大小；\n（2）求四台发动机总推力；\n（3）求每台发动机在该过程中对返回舱所做的功。',
          score: 10,
          answer: '$a=31.5\\,\\mathrm{m/s^2}$；总推力 $1.245\\times10^5\\,\\mathrm N$；每台发动机做功 $3.11\\times10^4\\,\\mathrm J$。',
          answerLines: 0,
        }),
        question({
          type: 'calculation',
          stem: '间距为 $L$ 的两条光滑平行金属轨道由倾斜段和水平段组成，倾角为 $30^\\circ$。倾斜段处在垂直轨道平面、磁感应强度为 $B$ 的匀强磁场中，上端接电容为 $C$ 的电容器；水平段右侧处在竖直向上的同强度磁场中，并接有电阻 $R$。质量为 $m$、电阻不计的导体棒从倾斜段由静止下滑，到达水平段时速度为 $v_0$。\n（1）写出导体棒在倾斜段稳定运动时的电流方向；\n（2）求导体棒进入右侧磁场瞬间的感应电动势；\n（3）若进入右侧磁场后仅受安培力阻碍，求棒最终停止时电阻产生的总热量，并说明能量转化关系。',
          score: 13,
          answer: '感应电动势 $E=BLv_0$；忽略其他损耗时 $Q=\\dfrac12mv_0^2$。',
          answerLines: 0,
          images: staticImage('physics-rail', 78),
        }),
        question({
          type: 'calculation',
          stem: '矩形区域 $MNQP$ 内有竖直向下、场强为 $E$ 的匀强电场。紧邻左边界 $MN$ 的右侧存在以 $MN$ 中点 O 为圆心、半径为 $r$ 的半圆形匀强磁场，磁场方向垂直纸面向里。带负电小球从 M 点以速率 $v$、与 MP 成角 $\\theta$ 射入磁场，重力不可忽略。\n（1）写出小球在磁场中做匀速圆周运动所需满足的电场条件；\n（2）若小球第一次离开磁场时速度恰好水平，求其圆周运动半径与 $\\theta$ 的关系；\n（3）小球离开磁场后与两竖直弹性挡板碰撞，碰撞时仅水平速度反向。建立小球竖直运动方程，并讨论它能够通过 N 点的条件。',
          score: 18,
          answer: '需满足 $|q|E=mg$；其余按圆周运动几何关系和分段抛体运动列式。',
          answerLines: 0,
          images: staticImage('physics-field', 70),
        }),
      ],
    },
  ]
  return paper
}
