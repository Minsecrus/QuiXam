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
 * 14 道单选题 + 4 道非选择题，共 100 分、75 分钟。
 * 化学式统一使用 KaTeX mhchem：`$\ce{...}$`，复杂流程用可缩放 SVG 呈现。
 */
export function simulatedChemistryPaper(): Paper {
  const paper = basePaper('高考结构模拟卷·化学（非真题）', '化学', 75)
  paper.info.school = '高中学业水平选择性考试结构模拟（非真题）'
  paper.info.fullScore = 100
  paper.info.subtitle = '可能用到的相对原子质量：H—1　C—12　N—14　O—16　Na—23　Mn—55　Fe—56'
  paper.info.notices = [
    '答题前，考生务必将姓名、准考证号填写在答题卡上。',
    '非选择题中的化学方程式须注明必要的反应条件。',
    '本卷为 QuiXam 原创排版测试卷，不是历年高考真题。',
  ]
  paper.layout.answerStyle = 'blank'
  paper.sections = [
    {
      ...createSection(
        '单项选择题',
        '本题共14小题，每小题3分，共42分。在每小题给出的四个选项中，只有一项符合题目要求。',
      ),
      questions: [
        question({
          type: 'single',
          stem: '我国重大工程使用了多种先进材料。下列材料属于无机半导体的是',
          score: 3,
          options: ['卫星芯片中的氮化镓', '深潜器外壳使用的钛合金', '射电望远镜反射面用树脂', '舰船甲板使用的特种钢'],
          answer: 'A',
        }),
        question({
          type: 'single',
          stem: '下列离子方程式书写正确的是',
          score: 3,
          options: [
            '冷的稀碱液吸收氯气：$\\ce{Cl2 + 2OH- -> Cl- + ClO- + H2O}$',
            '二氧化碳通入氯化钡溶液：$\\ce{Ba^2+ + CO2 + H2O -> BaCO3 v + 2H+}$',
            '碳酸氢镁与足量烧碱反应：$\\ce{Mg^2+ + HCO3- + OH- -> MgCO3 v + H2O}$',
            '铁与稀硝酸反应：$\\ce{Fe + 2H+ -> Fe^2+ + H2 ^}$',
          ],
          answer: 'A',
        }),
        question({
          type: 'single',
          stem: '根据价层电子对互斥模型判断，下列微粒的空间结构正确的是',
          score: 3,
          options: ['$\\ce{NH4+}$ 为正四面体', '$\\ce{CO2}$ 为 V 形', '$\\ce{H2O}$ 为直线形', '$\\ce{BF3}$ 为三角锥形'],
          answer: 'A',
        }),
        question({
          type: 'single',
          stem: '下列叙述正确的是',
          score: 3,
          options: [
            '浓硝酸见光分解只生成 $\\ce{NO}$ 和 $\\ce{O2}$',
            '向饱和 $\\ce{Na2CO3}$ 溶液中加入 $\\ce{CaSO4}$ 可转化生成 $\\ce{CaCO3}$',
            '小苏打的化学式为 $\\ce{Na2CO3}$',
            '铜与硫粉加热一定生成 $\\ce{CuS}$',
          ],
          answer: 'B',
        }),
        question({
          type: 'single',
          stem: '设 $N_A$ 为阿伏加德罗常数的值。$5.6\\,\\mathrm g$ 铁粉与足量氯气充分反应，下列说法正确的是',
          score: 3,
          options: [
            '生成 $0.1N_A$ 个 $\\ce{FeCl3}$ 分子',
            '消耗氯气 $0.30\\,\\mathrm{mol}$',
            '反应中转移电子数为 $0.3N_A$',
            '所得固体含 $0.2N_A$ 个氯原子',
          ],
          answer: 'C',
        }),
        question({
          type: 'single',
          stem: '离子液体 $[\\mathrm{BMIM}]\\ce{BF4}$ 由体积较大的有机阳离子与 $\\ce{BF4-}$ 构成。下列说法正确的是',
          score: 3,
          options: ['该物质只含共价键', '$\\ce{BF4-}$ 的空间结构为正四面体', '阳离子中所有碳原子杂化方式相同', '电负性大小为 $\\mathrm N>\\mathrm F>\\mathrm C$'],
          answer: 'B',
        }),
        question({
          type: 'single',
          stem: '下列实验操作能达到相应目的的是',
          score: 3,
          options: [
            '将 pH 试纸直接浸入待测溶液测 pH',
            '用量筒量取 $20.00\\,\\mathrm{mL}$ 盐酸',
            '用渗析法除去 $\\ce{Fe(OH)3}$ 胶体中的 $\\ce{NaCl}$',
            '将配制好的银氨溶液长期存放备用',
          ],
          answer: 'C',
        }),
        question({
          type: 'single',
          stem: '下列元素周期律判断正确的是',
          score: 3,
          options: [
            '离子半径：$r(\\ce{Na+})>r(\\ce{Al^3+})$',
            '电负性：$\\chi(\\ce{Na})>\\chi(\\ce{Cl})$',
            '$\\ce{Al2O3}$ 只具有碱性',
            '$\\ce{NaCl}$ 晶体中只含共价键',
          ],
          answer: 'A',
        }),
        question({
          type: 'single',
          stem: '用等浓度 $\\ce{NaOH}$ 溶液分别滴定等体积、等浓度的盐酸和醋酸，溶液导电能力随滴入碱液体积变化如图。下列判断正确的是',
          score: 3,
          options: ['实线可表示盐酸', '起始时醋酸导电能力更强', '两条曲线最低点对应相同离子组成', '过量碱液加入后溶液均不导电'],
          answer: 'A',
          images: staticImage('chemistry-titration', 66),
        }),
        question({
          type: 'single',
          stem: '聚对苯二甲酸乙二醇酯（PET）由对苯二甲酸与乙二醇缩聚得到。下列说法正确的是',
          score: 3,
          options: [
            'PET 的链节中不含酯基',
            '乙二醇不能发生氧化反应',
            '生成 PET 的同时有小分子生成',
            '对苯二甲酸分子中所有原子一定共面',
          ],
          answer: 'C',
        }),
        question({
          type: 'single',
          stem: '全固态钠电池放电时，金属钠电极发生反应 $\\ce{Na -> Na+ + e-}$，另一极发生嵌钠反应。下列说法正确的是',
          score: 3,
          options: [
            '金属钠电极为正极',
            '$\\ce{Na+}$ 由金属钠电极迁移至嵌钠电极',
            '电子经固态电解质迁移',
            '充电时金属钠电极发生氧化反应',
          ],
          answer: 'B',
        }),
        question({
          type: 'single',
          stem: '$\\ce{NaCl}$ 晶体中，$\\ce{Cl-}$ 构成立方最密堆积，$\\ce{Na+}$ 占据全部八面体空隙。下列说法正确的是',
          score: 3,
          options: [
            '每个 $\\ce{Na+}$ 周围最近的 $\\ce{Cl-}$ 有 4 个',
            '一个常规晶胞中含 4 个 $\\ce{NaCl}$',
            '$\\ce{Na+}$ 与 $\\ce{Cl-}$ 的配位数不同',
            '晶体熔化时不破坏离子键',
          ],
          answer: 'B',
        }),
        question({
          type: 'single',
          stem: '下列实验现象和结论均正确的是',
          score: 3,
          options: [
            '向酸化的 $\\ce{FeCl2}$ 溶液中加入氯水，再滴加 $\\ce{KSCN}$，溶液显红色，说明 $\\ce{Fe^2+}$ 被氧化',
            '向 $\\ce{Na2SiO3}$ 溶液中加盐酸生成白色沉淀，说明非金属性 $\\ce{Cl>Si}$',
            '用湿润 pH 试纸测定氯水 pH，可得到准确数值',
            '向某溶液加 $\\ce{BaCl2}$ 产生白色沉淀，可证明一定含 $\\ce{SO4^2-}$',
          ],
          answer: 'A',
        }),
        question({
          type: 'single',
          stem: '某温度下存在平衡：①$\\ce{FeO(s) + CO(g) <=> Fe(s) + CO2(g)}$，$K_{p1}=1$；②$\\ce{FeO(s) + C(s) <=> Fe(s) + CO(g)}$。各固体均足量，平衡时总压强为 $1600\\,\\mathrm{kPa}$。下列说法不正确的是',
          score: 3,
          options: [
            '$p(\\ce{CO})=p(\\ce{CO2})=800\\,\\mathrm{kPa}$',
            '反应②的 $K_p=800\\,\\mathrm{kPa}$',
            '等温缩小容器后再次平衡，总压强仍为 $1600\\,\\mathrm{kPa}$',
            '加入催化剂可增大反应①的平衡常数',
          ],
          answer: 'D',
        }),
      ],
    },
    {
      ...createSection('非选择题', '本题共4小题，共58分。'),
      questions: [
        question({
          type: 'essay',
          stem: '工业上以菱锰矿（主要成分为 $\\ce{MnCO3}$，含少量 $\\ce{CaCO3}$、$\\ce{FeCO3}$、$\\ce{NiCO3}$）制取金属锰，流程如图。已知 $K_{sp}(\\ce{NiS})\\ll K_{sp}(\\ce{MnS})$，且 $K_{sp}[\\ce{Fe(OH)3}]\\ll K_{sp}[\\ce{Mn(OH)2}]$。\n（1）写出基态 $\\ce{Mn^2+}$ 的价层电子排布，并判断 $\\ce{CO3^2-}$ 的空间结构；\n（2）写出两种可加快“酸浸”速率的措施；\n（3）酸浸时加入少量 $\\ce{MnO2}$ 将 $\\ce{Fe^2+}$ 氧化为 $\\ce{Fe^3+}$，写出离子方程式；\n（4）解释调 pH 可优先除铁、加入 $\\ce{(NH4)2S}$ 可优先除镍的原因；\n（5）说明使用硫酸而不使用浓盐酸进行酸浸的一项安全或工艺理由。',
          score: 14,
          answer: '$\\ce{Mn^2+}$ 为 $3d^5$，$\\ce{CO3^2-}$ 为平面三角形；氧化反应：$\\ce{MnO2 + 2Fe^2+ + 4H+ -> Mn^2+ + 2Fe^3+ + 2H2O}$。',
          answerLines: 0,
          images: staticImage('chemistry-process', 92),
        }),
        question({
          type: 'essay',
          stem: '亚硝酸钙 $\\ce{Ca(NO2)2}$ 可用作混凝土防冻阻锈剂。实验室用干燥的 $\\ce{NO}$ 与 $\\ce{CaO2}$ 反应制备产品，装置示意如图。\n（1）指出装置Ⅰ、Ⅲ和Ⅴ分别承担的主要作用；\n（2）实验开始前先通入一段时间 $\\ce{N2}$，说明目的；\n（3）用铜与稀硝酸制 $\\ce{NO}$，写出反应的离子方程式；\n（4）写出 $\\ce{NO}$ 与 $\\ce{CaO2}$ 生成 $\\ce{Ca(NO2)2}$ 的化学方程式；\n（5）若尾气用酸性 $\\ce{K2Cr2O7}$ 溶液吸收，说明该装置不能倒吸的结构要求；\n（6）设计一个实验检验产品中是否混有硝酸根。',
          score: 14,
          answer: '先通 $\\ce{N2}$ 用于排尽空气，避免 $\\ce{NO}$ 被氧化并防止副反应；$\\ce{3Cu + 2NO3- + 8H+ -> 3Cu^2+ + 2NO ^ + 4H2O}$。',
          answerLines: 0,
          images: staticImage('chemistry-apparatus', 94),
        }),
        question({
          type: 'essay',
          stem: '综合利用二氧化碳涉及反应：①$\\ce{CO2(g) + 3H2(g) <=> CH3OH(g) + H2O(g)}$，$\\Delta H_1<0$；②$\\ce{CO2(g) + H2(g) <=> CO(g) + H2O(g)}$，$\\Delta H_2>0$。反应历程和温度对转化率、选择性的影响如图。\n（1）根据反应历程图说明决定总反应速率的步骤应如何判断；\n（2）在 $1\\,\\mathrm L$ 恒容容器中投入 $1.0\\,\\mathrm{mol}\\ \\ce{CO2}$ 和 $3.0\\,\\mathrm{mol}\\ \\ce{H2}$，只发生反应①。平衡时生成 $0.50\\,\\mathrm{mol}\\ \\ce{CH3OH}$，总压强为 $6.0\\,\\mathrm{MPa}$，计算 $K_p$；\n（3）解释升高温度时甲醇选择性下降的原因；\n（4）冰晶体中水分子之间除范德华力外还存在何种主要作用力；\n（5）熔融碳酸盐燃料电池以 $\\ce{CO3^2-}$ 导电，写出通入氢气一极的电极反应。',
          score: 15,
          answer: '$K_p=\\dfrac1{27}\\,\\mathrm{MPa^{-2}}$；冰中有氢键；负极反应可写为 $\\ce{H2 + CO3^2- - 2e- -> H2O + CO2}$。',
          answerLines: 0,
          images: staticImage('chemistry-energy', 78),
        }),
        question({
          type: 'essay',
          stem: '某含氮杂环化合物的合成路线如图。已知丙烯在高温下与氯气发生烯丙位取代生成 A，A 与溴加成生成 B，B 在强碱水溶液中水解可得到甘油；苯酚 D 经硝化、还原得到氨基苯酚 F，之后与含醛基中间体发生缩合和环化。\n（1）写出 A 的名称和结构简式；\n（2）指出 F 中的官能团，并判断 B→甘油的反应类型；\n（3）甘油脱水可生成丙烯醛 $\\ce{CH2=CHCHO}$，写出丙烯醛与银氨溶液反应的化学方程式；\n（4）写出 B 的结构简式，并说明其水解时需要足量碱的原因；\n（5）若某中间体同时含酚羟基、氨基和醛基，列举两种可用于区分这三类官能团的特征反应。',
          score: 15,
          answer: 'A 为 3-氯丙烯（烯丙基氯）$\\ce{CH2=CHCH2Cl}$；F 含酚羟基和氨基；B→甘油属于水解（取代）反应。',
          answerLines: 0,
          images: staticImage('chemistry-synthesis', 94),
        }),
      ],
    },
  ]
  return paper
}
