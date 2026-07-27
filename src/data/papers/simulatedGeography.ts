import type { Paper } from '../../types'
import { basePaper, createSection, material, question } from '../paperFactory'

const staticImage = (name: string, widthPercent: number, align: 'center' | 'right' = 'center') => [
  {
    assetId: `static:/papers/simulated/${name}.svg`,
    widthPercent,
    align,
  },
]

/**
 * 江苏普通高中学业水平选择性考试结构模拟卷（原创，非真题）。
 *
 * 23 道单选题和 3 道综合题，共 100 分、75 分钟。
 * 图表情境覆盖自然地理、人文地理、区域发展和地理信息技术。
 */
export function simulatedGeographyPaper(): Paper {
  const paper = basePaper('高考结构模拟卷·地理（非真题）', '地理', 75)
  paper.info.school = '江苏选择性考试结构模拟（非真题）'
  paper.info.fullScore = 100
  paper.info.notices = [
    '答题前，考生务必将姓名、准考证号填写在答题卡上。',
    '作答综合题时，应结合图文材料，使用规范的地理术语。',
    '本卷为 QuiXam 原创排版测试卷，不是历年高考真题。',
  ]
  paper.sections = [
    {
      ...createSection(
        '选择题',
        '本题共23小题，每小题2分，共46分。在每小题给出的四个选项中，只有一项符合题目要求。',
      ),
      questions: [
        question({
          type: 'single',
          stem: '某校地理小组连续观测正午旗杆影长，记录结果如图。影长由甲日至乙日持续缩短，说明该地此期间正午太阳高度',
          score: 2,
          options: ['持续增大', '持续减小', '先增大后减小', '保持不变'],
          answer: 'A',
          images: staticImage('geography-sun', 66),
        }),
        question({
          type: 'single',
          stem: '若图示观测地位于北回归线以北，乙日之后旗杆正午影长开始增加，则乙日最可能接近',
          score: 2,
          options: ['春分日', '夏至日', '秋分日', '冬至日'],
          answer: 'B',
          images: staticImage('geography-sun', 66),
        }),
        question({
          type: 'single',
          stem: '北京时间20时，一艘使用世界时的科考船记录时间应为',
          score: 2,
          options: ['4时', '8时', '12时', '16时'],
          answer: 'C',
        }),
        question({
          type: 'single',
          stem: '冬季晴朗弱风的清晨，山谷近地面常形成逆温。此时最可能出现的是',
          score: 2,
          options: [
            '近地面气温随高度升高而升高',
            '大气对流旺盛，污染物迅速扩散',
            '谷底气温高于山坡同高度空气',
            '云量增多并形成强降水',
          ],
          answer: 'A',
        }),
        question({
          type: 'single',
          stem: '图示锋面系统自西向东移动。甲地即将经历的天气变化最可能是',
          score: 2,
          options: [
            '气温升高、气压下降且持续晴朗',
            '气温下降、气压升高并可能出现降水',
            '气温和气压均无明显变化',
            '先受副热带高压后受赤道低压控制',
          ],
          answer: 'B',
          images: staticImage('geography-front', 72),
        }),
        question({
          type: 'single',
          stem: '遥感影像显示某城市建设用地沿快速交通廊道呈指状扩展。造成该形态的主要因素是',
          score: 2,
          options: ['交通可达性差异', '地转偏向力', '昼夜长短变化', '洋流性质'],
          answer: 'A',
          images: staticImage('geography-urban', 68),
        }),
        question({
          type: 'single',
          stem: '该城市在轨道站点周边混合布局住宅、办公和公共服务，主要有利于',
          score: 2,
          options: [
            '延长居民平均通勤距离',
            '提高公共交通利用率',
            '消除中心城区地价差异',
            '减少所有类型的人口流动',
          ],
          answer: 'B',
          images: staticImage('geography-urban', 68),
        }),
        question({
          type: 'single',
          stem: '图示河流从上游到下游的纵剖面。上游河段落差较大的直接影响是',
          score: 2,
          options: ['下蚀能力较强', '河口盐度升高', '三角洲面积扩大', '河道弯曲度必然增大'],
          answer: 'A',
          images: staticImage('geography-river', 72),
        }),
        question({
          type: 'single',
          stem: '若该河中游修建大型水库，水库下游短期内最可能发生',
          score: 2,
          options: ['洪峰调节作用减弱', '输沙量减少', '河口泥沙沉积加快', '枯水期径流必然归零'],
          answer: 'B',
          images: staticImage('geography-river', 72),
        }),
        question({
          type: 'single',
          stem: '河口三角洲海岸线在一段时期持续后退，除水库拦沙外，可能的直接原因是',
          score: 2,
          options: ['海平面上升和波浪侵蚀增强', '上游植被破坏使输沙增加', '河口流速降低使沉积加强', '沿海降水增加使盐度下降'],
          answer: 'A',
        }),
        question({
          type: 'single',
          stem: '山地农户沿等高线修筑水平梯田，主要目的是',
          score: 2,
          options: ['增加坡面径流速度', '减少水土流失并改善土壤水分', '提高山顶风速', '扩大昼夜温差'],
          answer: 'B',
        }),
        question({
          type: 'single',
          stem: '干旱区推广早熟耐旱作物，并根据土壤墒情实施滴灌。这一组合措施主要体现了农业生产',
          score: 2,
          options: ['完全摆脱自然条件限制', '因地制宜利用水热资源', '以扩大耕地替代技术投入', '只追求单产而忽视生态效益'],
          answer: 'B',
        }),
        question({
          type: 'single',
          stem: '灌溉农业区若排水不畅、地下水位过高，最易出现的生态问题是',
          score: 2,
          options: ['土壤盐碱化', '石漠化', '冻土退化', '海水倒灌'],
          answer: 'A',
        }),
        question({
          type: 'single',
          stem: '临港钢铁企业利用进口矿石，并将副产煤气供应给附近化工企业。该产业布局的主要优势是',
          score: 2,
          options: [
            '靠近原料进口港且促进资源循环利用',
            '完全不受国际运输价格影响',
            '劳动力数量决定全部生产成本',
            '距消费市场越远越有利',
          ],
          answer: 'A',
          images: staticImage('geography-industry', 72),
        }),
        question({
          type: 'single',
          stem: '多家研发、零部件和整机企业在同一园区集聚，通常能够',
          score: 2,
          options: ['降低企业间信息交流效率', '共享基础设施并缩短协作距离', '消除产品生命周期', '使所有企业生产完全相同'],
          answer: 'B',
          images: staticImage('geography-industry', 72),
        }),
        question({
          type: 'single',
          stem: '该园区建立废热、再生水和副产品交换网络，对区域发展的主要意义是',
          score: 2,
          options: ['提高资源利用效率并减少排放', '增加一次能源消耗', '取消环境治理投入', '使产业链不再需要外部联系'],
          answer: 'A',
        }),
        question({
          type: 'single',
          stem: '某城市青年人口净流入但中心城区常住人口增速较慢，外围新城增长较快。最合理的解释是',
          score: 2,
          options: [
            '城市总人口一定减少',
            '住房与产业空间向外围扩展',
            '中心城区公共服务完全消失',
            '人口迁移只由自然增长决定',
          ],
          answer: 'B',
        }),
        question({
          type: 'single',
          stem: '老龄化社区在步行范围内增加助餐、康复和日间照料设施，主要体现公共服务布局应关注',
          score: 2,
          options: ['服务对象需求和空间可达性', '城市等级越高越集中', '设施数量越少越高效', '只按行政边界平均配置'],
          answer: 'A',
        }),
        question({
          type: 'single',
          stem: '夏季夜间，城市中心气温常高于郊区。建设连续通风廊道有助于缓解热岛，主要因为它能',
          score: 2,
          options: ['增强空气交换和热量输送', '提高建筑表面吸热率', '阻止近地面空气流动', '增加人为热排放'],
          answer: 'A',
        }),
        question({
          type: 'single',
          stem: '中低纬大陆西岸受寒流影响的地区，沿岸常出现雾但降水较少，主要因为',
          score: 2,
          options: [
            '近海空气降温凝结而大气层结较稳定',
            '海水蒸发旺盛并形成强对流',
            '暖流使海面温度远高于气温',
            '地形抬升不存在且空气绝对干燥',
          ],
          answer: 'A',
        }),
        question({
          type: 'single',
          stem: '赤道中东太平洋海温异常升高时，可能伴随',
          score: 2,
          options: [
            '东南信风减弱和秘鲁沿岸上升流减弱',
            '东南信风增强和暖水向西堆积',
            '全球各地降水同时增加',
            '秘鲁渔场营养盐供应增加',
          ],
          answer: 'A',
        }),
        question({
          type: 'single',
          stem: '对山洪危险区进行划分，需要叠加坡度、汇流路径、降水和居民点等图层。最适合完成该工作的技术是',
          score: 2,
          options: ['地理信息系统', '全球卫星导航系统', '遥感平台单景成像', '人工目测罗盘'],
          answer: 'A',
        }),
        question({
          type: 'single',
          stem: '山区短时强降水预警发布后，将风险信息按位置推送给下游居民。与只发布全县统一提示相比，该方式主要提高了',
          score: 2,
          options: ['预警的空间针对性', '天气系统移动速度', '河流天然蓄水量', '地表岩石抗风化能力'],
          answer: 'A',
        }),
      ],
    },
    {
      ...createSection('非选择题', '本题共3小题，每小题18分，共54分。'),
      questions: [
        material(
          `#材料
潘帕斯草原东部地势平坦，气候温和，天然草场和种植业交错分布，是重要的牛肉产区。传统放牧方式下，牛群活动范围大，单位面积产量不稳定。近年来，一些牧场把草地划分为多个小区，依据草高和土壤含水量轮换放牧；在低洼地保留湿地植被，在河岸设置缓冲带；将牛粪收集发酵，沼气用于加工厂供热，沼渣还田。企业还利用卫星定位记录牛群活动和草地恢复情况。
牛肉出口需要较长冷链运输。部分企业尝试优化饲料结构以减少单位产品的甲烷排放，并公开草地碳汇、能源消耗和运输排放数据。`,
          [
            question({
              type: 'solution',
              stem: '（1）分析潘帕斯草原东部发展商品化养牛业的自然和社会经济条件。（6分）\n（2）说明分区轮牧和保留河岸缓冲带对草地生态系统的作用。（6分）\n（3）从生产、加工和运输环节，为降低牛肉产品的单位碳排放提出措施。（6分）',
              score: 18,
              answer: '条件包括温和气候、平坦广阔草场、饲料和水源、港口市场与交通等。轮牧利于植被恢复、减少踩踏，缓冲带可拦截泥沙养分并保护水体。减排可优化饲料、提高生产效率、利用沼气、采用清洁能源和高效冷链运输等。',
              answerLines: 8,
            }),
          ],
          {
            stem: '阅读图文材料，完成下列要求。',
            images: staticImage('geography-pampas', 78),
          },
        ),
        material(
          `#材料
我国西北某盆地边缘日照丰富、降水稀少，春季大风频繁。当地在戈壁建设大型光伏电站，组件之间保留通道，并在外围设置草方格沙障。组件清洗过去主要使用地下水，后来改用少水清洁设备，并利用电站遮阴形成的微环境试种耐旱植物。监测发现，光伏板下白天地表温度和风速降低，部分地段土壤含水量提高；但若施工碾压过强，也会破坏地表结皮。
电站发电具有明显日变化，当地同时建设储能和外送通道，并探索利用富余电力制氢。`,
          [
            question({
              type: 'solution',
              stem: '（1）说明该地建设大型光伏电站的有利自然条件和需要防范的生态风险。（6分）\n（2）解释光伏板下部分地段土壤含水量提高的原因。（6分）\n（3）分析建设储能、外送通道和制氢设施对提高新能源利用率的作用。（6分）',
              score: 18,
              answer: '光照强、晴天多、土地广；风险包括施工破坏结皮、风蚀扬沙和地下水消耗。遮阴降低蒸发，板体削弱风速并汇集少量降水。储能平滑日内波动，外送扩大消纳空间，制氢把富余电转化为可储运能源。',
              answerLines: 8,
            }),
          ],
          {
            stem: '阅读图文材料，完成下列要求。',
            images: staticImage('geography-photovoltaic', 78),
          },
        ),
        material(
          `#材料
某沿江城市试点无人机配送急救用品。起降点设置在医院、社区服务中心和物流站，航线需避开机场净空区、高层建筑密集区和鸟类保护地。当地夏半年午后对流天气多，冬季清晨江面易出现大雾。试点平台综合实时风速、能见度、降水和电量数据，动态调整航线；当气象条件超限时，自动转由地面车辆配送。
城市规划部门准备依据人口、道路、医疗需求和空域限制，评估新增起降点，并要求平台保存飞行记录用于安全复盘。`,
          [
            question({
              type: 'solution',
              stem: '（1）分析医院和社区服务中心适合作为起降点的区位条件。（6分）\n（2）说明大风、强对流和大雾分别可能给低空配送带来的不利影响。（6分）\n（3）说明地理信息技术在新增起降点选址和运行安全管理中的应用。（6分）',
              score: 18,
              answer: '接近需求点、公共空间和交通设施，便于接驳与维护。大风影响稳定和能耗，强对流伴随阵风雷电降水，大雾降低能见度并影响传感器。GIS可叠加需求、可达性与限制图层选址，导航定位跟踪飞行，遥感和气象数据支持动态风险判断。',
              answerLines: 8,
            }),
          ],
          {
            stem: '阅读图文材料，完成下列要求。',
            images: staticImage('geography-low-altitude', 80),
          },
        ),
      ],
    },
  ]
  return paper
}
