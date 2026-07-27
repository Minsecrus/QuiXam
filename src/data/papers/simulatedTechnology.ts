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
 * 浙江普通高校招生技术选考结构模拟卷（原创，非真题）。
 *
 * 技术是浙江选考科目，包含信息技术和通用技术。两部分各 50 分，
 * 各含 12 道选择题与 3 道非选择题，全卷共 100 分、90 分钟。
 */
export function simulatedTechnologyPaper(): Paper {
  const paper = basePaper('浙江选考结构模拟卷·技术（非真题）', '技术', 90)
  paper.info.school = '浙江普通高校招生选考结构模拟（非真题）'
  paper.info.subtitle = '信息技术 50 分　通用技术 50 分'
  paper.info.fullScore = 100
  paper.info.notices = [
    '答题前，考生务必将姓名、准考证号填写在答题卡上。',
    '本卷“技术”为浙江选考口径，包含信息技术和通用技术两部分。',
    '本卷为 QuiXam 原创排版测试卷，不是历年浙江高考真题。',
  ]
  paper.sections = [
    {
      ...createSection(
        '信息技术选择题',
        '本题共12小题，每小题2分，共24分。在每小题给出的四个选项中，只有一项符合题目要求。',
      ),
      questions: [
        question({
          type: 'single',
          stem: '智能温室系统通过传感器采集温湿度，经网络上传到服务器并生成灌溉建议。下列关于数据和信息的说法正确的是',
          score: 2,
          options: [
            '传感器读数经过分析后可形成支持决策的信息',
            '数据一经采集就一定真实、完整且有用',
            '同一数据在任何情境中表达的信息完全相同',
            '信息系统只包含硬件和软件，不包含用户与规则',
          ],
          answer: 'A',
          images: staticImage('technology-system', 78),
        }),
        question({
          type: 'single',
          stem: '学校为教务系统设置访问权限。最符合“最小权限原则”的做法是',
          score: 2,
          options: [
            '所有教师共用管理员账号',
            '按岗位授予完成工作所需的最低权限',
            '为方便维护永久关闭日志记录',
            '把数据库备份保存在同一台服务器的同一磁盘',
          ],
          answer: 'B',
        }),
        question({
          type: 'single',
          stem: '一幅未经压缩的真彩色图像分辨率为 $1024\\times768$，颜色深度为24位，其数据量约为',
          score: 2,
          options: ['0.75 MB', '1.5 MB', '2.25 MB', '24 MB'],
          answer: 'C',
        }),
        question({
          type: 'single',
          stem: '浏览器访问采用 HTTPS 的网站时，HTTPS 相比 HTTP 主要增加了',
          score: 2,
          options: ['传输加密和身份认证机制', '网页自动成为开源软件', '服务器永久不受攻击', '本地文件容量自动减半'],
          answer: 'A',
        }),
        question({
          type: 'single',
          stem: '学生表中包含学号、姓名、班级和联系方式等字段。最适合作为主键的是',
          score: 2,
          options: ['姓名', '班级', '学号', '联系方式'],
          answer: 'C',
        }),
        question({
          type: 'single',
          stem: '分析空气质量监测数据前，发现部分时刻的传感器读数缺失。合理的处理方式是',
          score: 2,
          options: [
            '不检查原因，全部填为零',
            '根据缺失机制和分析目的选择删除或合理插补',
            '只保留缺失记录',
            '把所有数值转换为文本即可消除缺失',
          ],
          answer: 'B',
        }),
        question({
          type: 'single',
          stem: '执行 Python 表达式 `a=[2,5,8,11]; [x for x in a if x%2==0]`，结果是',
          score: 2,
          options: ['[2,5]', '[2,8]', '[5,11]', '[8,11]'],
          answer: 'B',
        }),
        question({
          type: 'single',
          stem: '某程序依次执行 `s=0`，再对 `i` 取1到4执行 `s=s+i*i`。程序结束时 `s` 的值是',
          score: 2,
          options: ['10', '16', '20', '30'],
          answer: 'D',
        }),
        question({
          type: 'single',
          stem: '图示算法输入正整数 n，循环中不断令 n 整除2并计数，直到 n 为0。该算法输出的是',
          score: 2,
          options: ['n 的十进制各位和', 'n 的二进制位数', '小于 n 的质数个数', 'n 的所有约数之和'],
          answer: 'B',
          images: staticImage('technology-flowchart', 52),
        }),
        question({
          type: 'single',
          stem: '打印任务按提交先后进入队列。若依次入队 A、B、C，完成一个任务后再入队 D，则下一次出队的任务是',
          score: 2,
          options: ['A', 'B', 'C', 'D'],
          answer: 'B',
        }),
        question({
          type: 'single',
          stem: '在升序数组中查找目标值，采用二分查找的前提是',
          score: 2,
          options: ['数组元素按某种顺序排列', '数组只能含偶数', '目标值一定在数组中', '每次必须从第一个元素比较'],
          answer: 'A',
        }),
        question({
          type: 'single',
          stem: '用历史招聘数据训练人才筛选模型时，发现模型对部分群体的推荐率明显偏低。负责任的改进措施是',
          score: 2,
          options: [
            '隐藏模型用途并直接上线',
            '检查训练数据和评价指标中的偏差，开展分群测试',
            '删除所有未被推荐者的数据',
            '只提高模型运行速度而不评估结果',
          ],
          answer: 'B',
        }),
      ],
    },
    {
      ...createSection('信息技术非选择题', '本题共3小题，共26分。'),
      questions: [
        question({
          type: 'solution',
          stem: '某温室每5分钟记录一次时间、空气温度、土壤湿度和水泵状态，部分数据如图。\n（1）指出表中一处可能的数据质量问题，并说明处理思路。\n（2）若要统计每天土壤湿度低于阈值的记录次数，写出数据处理的基本步骤。\n（3）系统根据单次低值立即开泵容易误动作。提出一种利用连续记录改进判断规则的方法。\n（4）为便于追溯自动灌溉决策，还应保存哪些信息？列举两项。',
          score: 8,
          answer: '可指出缺失、越界或时间重复，并结合传感器范围、相邻记录处理。按日期分组、筛选低于阈值记录并计数。可要求连续若干次低于阈值或使用滑动平均。应保存规则版本、阈值、输入数据、执行结果、人工干预和时间等。',
          answerLines: 5,
          images: staticImage('technology-data', 82),
        }),
        question({
          type: 'solution',
          stem: '公交站客流程序维护一个长度不超过5的队列 q，保存最近5分钟人数。每分钟读入人数 x：若队列已满则删除最早数据，再将 x 加入队尾，最后输出平均值。\n（1）写出“队列已满”的判断条件。\n（2）说明删除最早数据和加入队尾分别对应的队列操作。\n（3）若依次读入 6、8、5、9、12、10，处理完最后一个数后 q 中的数据是什么？平均值是多少？\n（4）若还要输出最近5分钟的最大增幅，说明可如何遍历计算。',
          score: 8,
          answer: 'len(q)==5；出队、入队。最终为[8,5,9,12,10]，平均8.8。遍历相邻元素计算后项减前项并维护最大值。',
          answerLines: 5,
          images: staticImage('technology-queue', 68),
        }),
        question({
          type: 'solution',
          stem: '学校拟建设实验器材借还系统。学生扫码借用，教师审核特殊器材，管理员维护库存；系统需支持逾期提醒和损坏记录。\n（1）按“输入—处理—输出”列举该系统的一组完整数据流。\n（2）设计器材表和借用记录表的主要字段，并说明两表如何关联。\n（3）说明为何不能仅用姓名标识学生。\n（4）从身份认证、访问控制、数据备份和隐私保护中任选三方面提出具体措施。\n（5）系统上线前应开展哪些测试，以验证并发借用同一器材时不会出现负库存？',
          score: 10,
          answer: '示例：扫码输入学生和器材编号，系统校验资格与库存、写入借用记录，输出借用结果和归还期限。器材表含器材ID、名称、库存等；记录表含记录ID、学生ID、器材ID、借还时间和状态，以器材ID关联。姓名不唯一且可变化。安全措施应具体。需进行并发、事务和异常回滚测试并校验库存约束。',
          answerLines: 6,
          images: staticImage('technology-system', 78),
        }),
      ],
    },
    {
      ...createSection(
        '通用技术选择题',
        '本题共12小题，每小题2分，共24分。在每小题给出的四个选项中，只有一项符合题目要求。',
      ),
      questions: [
        question({
          type: 'single',
          stem: '建设大型水电工程时，设计团队同时评估发电、防洪、生态和移民安置。这主要体现技术活动',
          score: 2,
          options: ['只追求技术性能', '具有综合性并受多种因素制约', '不需要价值判断', '与社会环境无关'],
          answer: 'B',
        }),
        question({
          type: 'single',
          stem: '裁布剪的手柄加宽并包覆软质材料，主要改善了人机关系中的',
          score: 2,
          options: ['高效和健康目标', '信息交互的安全加密', '结构的静态稳定性', '产品生产的标准件比例'],
          answer: 'A',
        }),
        question({
          type: 'single',
          stem: '户外水杯同时要求保温、轻便、可回收和价格适中。设计时对这些要求进行权衡，体现了设计的',
          score: 2,
          options: ['创新原则', '实用原则', '技术规范原则', '多目标综合原则'],
          answer: 'D',
        }),
        question({
          type: 'single',
          stem: '图示薄板与方管需要可拆卸连接，且安装空间允许从两侧操作。较合适的连接件是',
          score: 2,
          options: ['铆钉', '焊条', '螺栓螺母', '热熔胶'],
          answer: 'C',
          images: staticImage('technology-connection', 62),
        }),
        question({
          type: 'single',
          stem: '根据图示主视图和俯视图，正确的左视图是',
          score: 2,
          options: ['图 A', '图 B', '图 C', '图 D'],
          answer: 'C',
          images: staticImage('technology-views', 82),
        }),
        question({
          type: 'single',
          stem: '在钢板上加工一个直径8 mm的通孔，合理的基本操作顺序是',
          score: 2,
          options: ['划线—冲眼—钻孔—去毛刺', '钻孔—划线—淬火—锉削', '锯割—攻丝—冲眼—钻孔', '划线—焊接—套丝—抛光'],
          answer: 'A',
        }),
        question({
          type: 'single',
          stem: '图示零件需要先下料，再钻孔，最后折弯。把钻孔安排在折弯前的主要原因是',
          score: 2,
          options: ['平板状态更易定位和夹持', '折弯后材料硬度必然为零', '钻孔会自动完成折弯', '可省去所有测量步骤'],
          answer: 'A',
          images: staticImage('technology-process', 66),
        }),
        question({
          type: 'single',
          stem: '为提高书架承载能力，在不显著增加材料用量的情况下，较有效的措施是',
          score: 2,
          options: ['减小所有连接面的面积', '增加斜撑并改善节点连接', '把横板厚度降为原来一半', '使重物全部放在最上层'],
          answer: 'B',
        }),
        question({
          type: 'single',
          stem: '分析校园雨水收集系统时发现，扩大蓄水池会增加供水稳定性但也提高成本。这说明系统分析需要',
          score: 2,
          options: ['只考虑单个要素', '兼顾整体目标和约束条件', '忽略要素间联系', '保证局部最优即整体最优'],
          answer: 'B',
        }),
        question({
          type: 'single',
          stem: '恒温箱根据温度传感器读数自动调节加热器功率。与开环控制相比，该系统的主要特点是',
          score: 2,
          options: ['存在反馈环节', '不需要被控对象', '控制量不受偏差影响', '输出不能被测量'],
          answer: 'A',
          images: staticImage('technology-control', 74),
        }),
        question({
          type: 'single',
          stem: '在继电器线圈两端反向并联二极管，主要用于',
          score: 2,
          options: ['提高电源电压', '吸收线圈断电时的反向感应电压', '使继电器始终吸合', '把交流信号放大为直流'],
          answer: 'B',
        }),
        question({
          type: 'single',
          stem: '比较器电路中，传感器电压高于基准电压时输出高电平。若希望环境更干燥时报警，应使湿度降低时',
          score: 2,
          options: [
            '传感器电压相对基准电压升高',
            '电源电压始终为零',
            '比较器两个输入端短接',
            '报警器与传感器完全断开',
          ],
          answer: 'A',
        }),
      ],
    },
    {
      ...createSection('通用技术非选择题', '本题共3小题，共26分。'),
      questions: [
        question({
          type: 'solution',
          stem: '某商铺拟在门口安装自动晴雨棚，设计要求：宽度覆盖入口；检测到降雨时自动展开；风速过大时优先收回；停电时可手动操作；收拢后不妨碍通行。结构示意如图。\n（1）从功能、环境和安全三个方面各写一条设计约束。\n（2）为支撑臂选择材料时，应重点考虑哪些性能？\n（3）说明“风速过大优先收回”在控制逻辑中如何实现。\n（4）提出一项模型试验，用于验证棚体抗风稳定性。',
          score: 8,
          answer: '约束应对应遮雨范围、室外耐候和夹伤/坠落风险。材料关注强度、刚度、耐腐蚀、质量与加工性。控制逻辑中大风信号具有更高优先级，屏蔽展开指令并触发收回。可制作缩比或样机，在不同风速和方向下测位移、受力及连接可靠性。',
          answerLines: 5,
          images: staticImage('technology-rain-shelter', 82),
        }),
        question({
          type: 'solution',
          stem: '阳台外晾衣杆采用手摇驱动，要求升降平稳、任意位置可靠停留，并防止两端高低不一致。初步方案如图。\n（1）选择一种合适的传动方式，并说明理由。\n（2）提出防止晾衣杆倾斜的结构措施。\n（3）指出实现“任意位置可靠停留”需要解决的技术问题，并给出一种措施。\n（4）画出或文字描述手柄轴与墙面支架之间的可转动、不可轴向脱落连接。',
          score: 8,
          answer: '可用蜗轮蜗杆、齿轮绳轮或同步带等，理由应匹配减速、自锁或同步。两端可由同轴绳轮或同步传动联动。停留需防逆转，可采用自锁传动、棘轮或制动。连接可用轴承/轴套支承并以轴肩、挡圈或螺母轴向限位。',
          answerLines: 5,
          images: staticImage('technology-lift', 82),
        }),
        question({
          type: 'solution',
          stem: '学校草坪拟安装土壤湿度自动报警和浇水装置。湿度传感器输出电压随湿度增大而升高；土壤过干时先蜂鸣提示，持续过干30秒后打开电磁阀，湿度恢复后关闭。控制电路框图如图。\n（1）指出被控对象、被控量和主要执行器。\n（2）说明比较器基准电压的作用，以及调高基准电压对启动浇水阈值的影响。\n（3）为什么要设置30秒延时？\n（4）在电磁阀驱动级中使用三极管和续流二极管，分别起什么作用？\n（5）设计一个包含正常、临界、传感器断线和连续降雨情形的测试方案。',
          score: 10,
          answer: '被控对象为草坪土壤水分系统，被控量为土壤湿度，执行器为电磁阀/水泵。基准电压设定比较阈值；具体影响须结合比较器输入连接判断，本图中调高基准意味着需更高传感器电压才停止浇水。延时可滤除瞬时波动。三极管放大电流并开关驱动，二极管吸收感性反压。测试应覆盖边界、故障与雨水联锁并检查输出和恢复。',
          answerLines: 6,
          images: staticImage('technology-circuit', 88),
        }),
      ],
    },
  ]
  return paper
}
