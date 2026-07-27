import type { Paper } from '../../types'
import { basePaper, createSection, question } from '../paperFactory'

/**
 * 原题来源（教育部教育考试院）：
 * https://www.neea.edu.cn/xhtml1/report/2401/426-1.htm
 *
 * 题面逐页按考试院公开原卷校对。答案栏只录入已核验的客观题答案，
 * 公开原卷未附的解答题参考解答保持为空。
 */
export function official2024MathPaper(): Paper {
  const paper = basePaper('2024年高考综合改革适应性测试·数学', '数学', 120)
  paper.info.school = '2024年高考综合改革适应性测试'
  paper.sections = [
    {
      ...createSection(
        '选择题',
        '本题共8小题，每小题5分，共40分。在每小题给出的四个选项中，只有一项是符合题目要求的。',
      ),
      questions: [
        question({
          type: 'single',
          stem: '样本数据16，24，14，10，20，30，12，14，40的中位数为',
          score: 5,
          options: ['14', '16', '18', '20'],
          answer: 'B',
        }),
        question({
          type: 'single',
          stem: '椭圆 $\\dfrac{x^2}{a^2}+y^2=1\\ (a>1)$ 的离心率为 $\\dfrac12$，则 $a=$',
          score: 5,
          options: ['$\\dfrac{2\\sqrt3}{3}$', '$\\sqrt2$', '$\\sqrt3$', '$2$'],
          answer: 'A',
        }),
        question({
          type: 'single',
          stem: '记等差数列 $\\{a_n\\}$ 的前 $n$ 项和为 $S_n$，$a_3+a_7=6$，$a_{12}=17$，则 $S_{16}=$',
          score: 5,
          options: ['120', '140', '160', '180'],
          answer: 'C',
        }),
        question({
          type: 'single',
          stem: '设 $\\alpha$，$\\beta$ 是两个平面，$m$，$l$ 是两条直线，则下列命题为真命题的是',
          score: 5,
          options: [
            '若 $\\alpha\\perp\\beta$，$m\\parallel\\alpha$，$l\\parallel\\beta$，则 $m\\perp l$',
            '若 $m\\subset\\alpha$，$l\\subset\\beta$，$m\\parallel l$，则 $\\alpha\\parallel\\beta$',
            '若 $\\alpha\\cap\\beta=m$，$l\\parallel\\alpha$，$l\\parallel\\beta$，则 $m\\parallel l$',
            '若 $m\\perp\\alpha$，$l\\perp\\beta$，$m\\parallel l$，则 $\\alpha\\perp\\beta$',
          ],
          answer: 'C',
        }),
        question({
          type: 'single',
          stem: '甲、乙、丙等5人站成一排，且甲不在两端，乙和丙之间恰有2人，则不同排法共有',
          score: 5,
          options: ['20种', '16种', '12种', '8种'],
          answer: 'B',
        }),
        question({
          type: 'single',
          stem: '已知 $Q$ 为直线 $l:x+2y+1=0$ 上的动点，点 $P$ 满足 $\\overrightarrow{QP}=(1,-3)$，记 $P$ 的轨迹为 $E$，则',
          score: 5,
          options: [
            '$E$ 是一个半径为 $\\sqrt5$ 的圆',
            '$E$ 是一条与 $l$ 相交的直线',
            '$E$ 上的点到 $l$ 的距离均为 $\\sqrt5$',
            '$E$ 是两条平行直线',
          ],
          answer: 'C',
        }),
        question({
          type: 'single',
          stem: '已知 $\\theta\\in\\left(\\dfrac{3\\pi}{4},\\pi\\right)$，$\\tan2\\theta=-4\\tan\\left(\\theta+\\dfrac\\pi4\\right)$，则 $\\dfrac{1+\\sin2\\theta}{2\\cos^2\\theta+\\sin2\\theta}=$',
          score: 5,
          options: ['$\\dfrac14$', '$\\dfrac34$', '$1$', '$\\dfrac32$'],
          answer: 'A',
        }),
        question({
          type: 'single',
          stem: '设双曲线 $C:\\dfrac{x^2}{a^2}-\\dfrac{y^2}{b^2}=1\\ (a>0,b>0)$ 的左、右焦点分别为 $F_1$，$F_2$，过坐标原点的直线与 $C$ 交于 $A$，$B$ 两点，$|F_1B|=2|F_1A|$，$\\overrightarrow{F_2A}\\cdot\\overrightarrow{F_2B}=4a^2$，则 $C$ 的离心率为',
          score: 5,
          options: ['$\\sqrt2$', '$2$', '$\\sqrt5$', '$\\sqrt7$'],
          answer: 'D',
        }),
      ],
    },
    {
      ...createSection(
        '选择题',
        '本题共3小题，每小题6分，共18分。在每小题给出的选项中，有多项符合题目要求。全部选对的得6分，部分选对的得部分分，有选错的得0分。',
      ),
      questions: [
        question({
          type: 'multiple',
          stem: '已知函数 $f(x)=\\sin\\left(2x+\\dfrac{3\\pi}{4}\\right)+\\cos\\left(2x+\\dfrac{3\\pi}{4}\\right)$，则',
          score: 6,
          options: [
            '函数 $f\\left(x-\\dfrac\\pi4\\right)$ 为偶函数',
            '曲线 $y=f(x)$ 的对称轴为 $x=k\\pi$，$k\\in\\mathbb Z$',
            '$f(x)$ 在区间 $\\left(\\dfrac\\pi3,\\dfrac\\pi2\\right)$ 单调递增',
            '$f(x)$ 的最小值为 $-2$',
          ],
          answer: 'AC',
        }),
        question({
          type: 'multiple',
          stem: '已知复数 $z$，$w$ 均不为0，则',
          score: 6,
          options: [
            '$z^2=|z|^2$',
            '$\\dfrac z{\\bar z}=\\dfrac{z^2}{|z|^2}$',
            '$\\overline{z-w}=\\bar z-\\bar w$',
            '$\\left|\\dfrac zw\\right|=\\dfrac{|z|}{|w|}$',
          ],
          answer: 'BCD',
        }),
        question({
          type: 'multiple',
          stem: '已知函数 $f(x)$ 的定义域为 $\\mathbb R$，且 $f\\left(\\dfrac12\\right)\\ne0$，若 $f(x+y)+f(x)f(y)=4xy$，则',
          score: 6,
          options: [
            '$f\\left(-\\dfrac12\\right)=0$',
            '$f\\left(\\dfrac12\\right)=-2$',
            '函数 $f\\left(x-\\dfrac12\\right)$ 是偶函数',
            '函数 $f\\left(x+\\dfrac12\\right)$ 是减函数',
          ],
          answer: 'ABD',
        }),
      ],
    },
    {
      ...createSection('填空题', '本题共3小题，每小题5分，共15分。'),
      questions: [
        question({
          type: 'fill',
          stem: '已知集合 $A=\\{-2,0,2,4\\}$，$B=\\{x\\mid |x-3|\\le m\\}$，若 $A\\cap B=A$，则 $m$ 的最小值为______。',
          score: 5,
          answer: '5',
        }),
        question({
          type: 'fill',
          stem: '已知轴截面为正三角形的圆锥 $MM\\prime$ 的高与球 $O$ 的直径相等，则圆锥 $MM\\prime$ 的体积与球 $O$ 的体积的比值是______，圆锥 $MM\\prime$ 的表面积与球 $O$ 的表面积的比值是______。',
          score: 5,
          answer: '$2\\sqrt3:3$；$2:3$',
        }),
        question({
          type: 'fill',
          stem: '以 $\\max M$ 表示数集 $M$ 中最大的数。设 $0<a<b<c<1$，已知 $b\\ge2a$ 或 $a+b\\le1$，则 $\\max\\{b-a,c-b,1-c\\}$ 的最小值为______。',
          score: 5,
          answer: '$\\dfrac15$',
        }),
      ],
    },
    {
      ...createSection(
        '解答题',
        '本题共5小题，共77分。解答应写出文字说明、证明过程或演算步骤。',
      ),
      questions: [
        question({
          type: 'essay',
          stem: '已知函数 $f(x)=\\ln x+x^2+ax+2$ 在点 $(2,f(2))$ 处的切线与直线 $2x+3y=0$ 垂直。\n（1）求 $a$；\n（2）求 $f(x)$ 的单调区间和极值。',
          score: 13,
          answer: '',
          answerLines: 0,
        }),
        question({
          type: 'essay',
          stem: '盒中有标记数字1，2，3，4的小球各2个，随机一次取出3个小球。\n（1）求取出的3个小球上的数字两两不同的概率；\n（2）记取出的3个小球上的最小数字为 $X$，求 $X$ 的分布列及数学期望 $E(X)$。',
          score: 15,
          answer: '',
          answerLines: 0,
        }),
        question({
          type: 'essay',
          stem: '如图，平行六面体 $ABCD-A_1B_1C_1D_1$ 中，底面 $ABCD$ 是边长为2的正方形，$O$ 为 $AC$ 与 $BD$ 的交点，$AA_1=2$，$\\angle C_1CB=\\angle C_1CD$，$\\angle C_1CO=45^\\circ$。\n（1）证明：$C_1O\\perp$ 平面 $ABCD$；\n（2）求二面角 $B-AA_1-D$ 的正弦值。',
          score: 15,
          answer: '',
          answerLines: 0,
          images: [
            {
              assetId: 'static:/papers/official-2024/math-q17.svg',
              widthPercent: 58,
              align: 'right',
            },
          ],
        }),
        question({
          type: 'essay',
          stem: '已知抛物线 $C:y^2=4x$ 的焦点为 $F$，过 $F$ 的直线 $l$ 交 $C$ 于 $A$，$B$ 两点，过 $F$ 与 $l$ 垂直的直线交 $C$ 于 $D$，$E$ 两点，其中 $B$，$D$ 在 $x$ 轴上方，$M$，$N$ 分别为 $AB$，$DE$ 的中点。\n（1）证明：直线 $MN$ 过定点；\n（2）设 $G$ 为直线 $AE$ 与直线 $BD$ 的交点，求 $\\triangle GMN$ 面积的最小值。',
          score: 17,
          answer: '',
          answerLines: 0,
        }),
        question({
          type: 'essay',
          stem: '离散对数在密码学中有重要的应用。设 $p$ 是素数，集合 $X=\\{1,2,\\cdots,p-1\\}$，若 $u,v\\in X$，$m\\in\\mathbb N$，记 $u\\otimes v$ 为 $uv$ 除以 $p$ 的余数，$u^{m,\\otimes}$ 为 $u^m$ 除以 $p$ 的余数；设 $a\\in X$，$1,a,a^{2,\\otimes},\\cdots,a^{p-2,\\otimes}$ 两两不同，若 $a^{n,\\otimes}=b\\ (n\\in\\{0,1,\\cdots,p-2\\})$，则称 $n$ 是以 $a$ 为底 $b$ 的离散对数，记为 $n=\\log(p)_a b$。\n（1）若 $p=11$，$a=2$，求 $a^{p-1,\\otimes}$；\n（2）对 $m_1,m_2\\in\\{0,1,\\cdots,p-2\\}$，记 $m_1\\oplus m_2$ 为 $m_1+m_2$ 除以 $p-1$ 的余数（当 $m_1+m_2$ 能被 $p-1$ 整除时，$m_1\\oplus m_2=0$）。证明：$\\log(p)_a(b\\otimes c)=\\log(p)_a b\\oplus\\log(p)_a c$，其中 $b,c\\in X$；\n（3）已知 $n=\\log(p)_a b$。对 $x\\in X$，$k\\in\\{1,2,\\cdots,p-2\\}$，令 $y_1=a^{k,\\otimes}$，$y_2=x\\otimes b^{k,\\otimes}$。证明：$x=y_2\\otimes y_1^{n(p-2),\\otimes}$。',
          score: 17,
          answer: '',
          answerLines: 0,
        }),
      ],
    },
  ]
  return paper
}
