import type { Paper, Question } from '../../types'
import { basePaper, createSection, material, question, readingQuestion } from '../paperFactory'

function choice(stem: string, options: string[], score: number, answer: string): Question {
  return question({ type: 'single', stem, options, score, answer })
}

/**
 * 原题来源（教育部教育考试院）：
 * https://www.neea.edu.cn/html1/report/2401/499-1.htm
 *
 * 题面逐页按考试院公开原卷校对；答案栏录入公开参考答案中的客观题和语法填空，
 * 两项写作不放入自编范文。
 */
export function official2024EnglishPaper(): Paper {
  const paper = basePaper('2024年高考综合改革适应性测试·英语', '英语', 120)
  paper.info.school = '2024年高考综合改革适应性测试'
  // 英语原卷正文密度较高，五号字更接近考试院公开的 12 页版面。
  paper.layout.fontSize = 'small'
  paper.sections = [
    {
      ...createSection('听力', '共两节，满分30分。'),
      questions: [
        material(
          '',
          [
            choice(
              'What will Chris do next?',
              ['Drink some coffee.', 'Watch the World Cup.', 'Go to sleep.'],
              1.5,
              'A',
            ),
            choice(
              'What is the probable relationship between the speakers?',
              ['Strangers.', 'Classmates.', 'Relatives.'],
              1.5,
              'A',
            ),
            choice(
              'What is the woman’s attitude to the man’s suggestion?',
              ['Favorable.', 'Tolerant.', 'Negative.'],
              1.5,
              'C',
            ),
            choice(
              'What can we learn about Tom?',
              [
                'He’s smart for his age.',
                'He’s unwilling to study.',
                'He’s difficult to get along with.',
              ],
              1.5,
              'B',
            ),
            choice(
              'What did Kevin do yesterday?',
              [
                'He went swimming.',
                'He cleaned up his house.',
                'He talked with his grandparents.',
              ],
              1.5,
              'C',
            ),
          ],
          {
            stem: '第一节（共5小题；每小题1.5分，满分7.5分）\n听下面5段对话。每段对话后有一个小题，从题中所给的A、B、C三个选项中选出最佳选项。听完每段对话后，你都有10秒钟的时间来回答有关小题和阅读下一小题。每段对话仅读一遍。\n例：How much is the shirt?\nA. £19.15.　B. £9.18.　C. £9.15.\n答案是C。',
          },
        ),
        material(
          '',
          [
            choice(
              '听第6段材料，回答第6、7题。\nWho is arranging the meeting?',
              ['Peter.', 'David.', 'Janet.'],
              1.5,
              'C',
            ),
            choice(
              'When does the man prefer to have the meeting?',
              ['This Wednesday.', 'This Friday.', 'Next Monday.'],
              1.5,
              'B',
            ),
            choice(
              '听第7段材料，回答第8、9题。\nWhat are the speakers talking about?',
              ['Travel experiences.', 'Vacation plans.', 'Favorite seasons.'],
              1.5,
              'B',
            ),
            choice(
              'What does the man want to do?',
              ['Go to the beach.', 'Find a summer job.', 'Move to Washington.'],
              1.5,
              'A',
            ),
            choice(
              '听第8段材料，回答第10至12题。\nWhat does the news say about big online spenders in the US?',
              [
                'The number of them grows slowly.',
                'There are more men than women.',
                'They make up half of all shoppers.',
              ],
              1.5,
              'B',
            ),
            choice(
              'How much did Americans spend shopping online last year?',
              ['$453 billion.', '$990 billion.', '$1,500 billion.'],
              1.5,
              'A',
            ),
            choice(
              'What did George buy online last Sunday?',
              ['An adventure novel.', 'A software package.', 'A note by Mark Twain.'],
              1.5,
              'C',
            ),
            choice(
              '听第9段材料，回答第13至16题。\nWhat has Richard been doing?',
              ['Visiting a museum.', 'Watching TV.', 'Studying.'],
              1.5,
              'B',
            ),
            choice(
              'Why does Susan call Richard?',
              ['To ask for help.', 'To give thanks.', 'To make an appointment.'],
              1.5,
              'A',
            ),
            choice(
              'What does Susan want to do?',
              ['See an exhibition.', 'Buy a new cell phone.', 'Take pictures of the snow.'],
              1.5,
              'C',
            ),
            choice(
              'What will the speakers probably do?',
              ['Go to a park.', 'Play football.', 'Attend a party.'],
              1.5,
              'A',
            ),
            choice(
              '听第10段材料，回答第17至20题。\nWhere did the speaker learn about college?',
              ['From the movies.', 'From her family.', 'From the books.'],
              1.5,
              'A',
            ),
            choice(
              'What helped change the speaker’s attitude towards study?',
              ['Her professor’s advice.', 'Her graduate program.', 'Her trip to Africa.'],
              1.5,
              'B',
            ),
            choice(
              'How does the speaker feel when she talks about her past experiences?',
              ['Regretful.', 'Relieved.', 'Grateful.'],
              1.5,
              'C',
            ),
            choice(
              'Who is the speaker probably talking to?',
              ['Conservation workers.', 'High school students.', 'College teachers.'],
              1.5,
              'B',
            ),
          ],
          {
            stem: '第二节（共15小题；每小题1.5分，满分22.5分）\n听下面5段对话或独白。每段对话或独白后有几个小题，从题中所给的A、B、C三个选项中选出最佳选项。听每段对话或独白前，你将有时间阅读各个小题，每小题5秒钟；听完后，各小题给出5秒钟的作答时间。每段对话或独白读两遍。',
          },
        ),
      ],
    },
    {
      ...createSection('阅读', '共两节，满分50分。'),
      questions: [
        material(
          `#A
#Yellowstone Poster Exhibition to Be on View at UW’s Coe Library
A first-of-its-kind exhibition that focuses on the history of Yellowstone National Park posters will be on display at the University of Wyoming’s Coe Library beginning Tuesday, February 1.
“Wonderland Illustrated” will present posters and poster-style illustrations of the park spanning from the 1870s through 2022. The exhibition will be located on Level 3 of Coe Library. It will be on view through Tuesday, May 31.
The exhibition takes place at the same time as this year’s 150th anniversary of the creation of Yellowstone National Park. The posters in the exhibition serve the purpose of both advertising and art.
“We’re thrilled to be working with Yellowstone collectors Jack and Susan Davis, and Larry and Thea Lancaster to bring this exhibition to the University of Wyoming as part of year-long celebrations recognizing Yellowstone’s 150th anniversary,” says Tamsen Hert, head of UW Libraries’ Emmett D. Chisum Special Collections. “This exhibition involves the history of printing, art, photography and advertising over 16 decades. The images reproduced are found on travel brochures, postcards and maps—many of which are held in our collections.”
One poster from the exhibition—Henry Wellge’s “Yellowstone National Park” from 1904—was recently purchased with donated funds and is now part of UW Libraries’ Emmett D. Chisum Special Collections. Wellge, a productive bird’s-eye-view artist, designed the piece for the Northern Pacific Railroad, which used it to advertise the park. This is a unique piece, as posters such as this one were printed on soft paper and very few have survived.`,
          [
            choice(
              'How long will the exhibition “Wonderland Illustrated” last?',
              ['Two weeks.', 'Three months.', 'Four months.', 'One year.'],
              2.5,
              'C',
            ),
            choice(
              'What is a purpose of the exhibition?',
              [
                'To remember a famous artist.',
                'To raise fund for Coe Library.',
                'To mark the anniversary of a national park.',
                'To tell the history of the University of Wyoming.',
              ],
              2.5,
              'C',
            ),
            choice(
              'What do we know about the 1904 poster Henry Wellge designed?',
              [
                'It is rare in the world.',
                'It is in black and white.',
                'It is printed on cloth.',
                'It is owned by a professor.',
              ],
              2.5,
              'A',
            ),
          ],
          {
            stem: '第一节（共15小题；每小题2.5分，满分37.5分）\n阅读下列短文，从每题所给的A、B、C、D四个选项中选出最佳选项。',
          },
        ),
        material(
          `#B
Parrots are prey animals, which means that other predators（捕食者）in the wild, such as hawks or snakes, are looking to make them into a meal. This one factor influences parrots’ behavior in your house more than any other.
Parrots are most easily hurt when feeding on the ground; membership in a group plays an important function in ensuring their safety and improving their chances of survival from attacks by predators. The most common predators of parrots include hawks, snakes, cats, monkeys, and bats. Some predators make attacks only during the day while others hunt in the night.
As prey animals, parrots are constantly watching out for danger and they instinctively（本能地）react to risks. Their first choice is to take flight. However, if this is not possible, they will fight with their powerful beaks to defend themselves.
Because their biggest enemy is the hawk, parrots are especially reactive to quick movements from above and behind. For this reason, it is wise to avoid quick, sudden movements near your bird. This is a built-in reaction not subject to logic or reason. Simple and relatively harmless household objects can draw extreme fear responses from a bird. For example, a balloon may represent a hawk or a vacuum hose（吸尘器软管）may be the same as a snake in your bird’s mind.
As prey animals, parrots are often frightened by exposure to new household items or strangers. It is important to expose your bird to safe experiences and changes starting at a very young age to build flexibility and improve their adaptability. Variety in diet and toys, travel, and exposure to new people and places all help to make your bird more flexible and adaptable to change.`,
          [
            choice(
              'What is important for parrots to better survive from attacks in the wild?',
              [
                'Living in a group.',
                'Growing beautiful feathers.',
                'Feeding on the ground.',
                'Avoiding coming out at night.',
              ],
              2.5,
              'A',
            ),
            choice(
              'What is parrots’ first response to an immediate risk?',
              ['To attack back.', 'To get away.', 'To protect the young.', 'To play dead.'],
              2.5,
              'B',
            ),
            choice(
              'Why would a balloon frighten a parrot?',
              [
                'It may explode suddenly.',
                'It may be in a strange shape.',
                'It may have a strong color.',
                'It may move around quickly.',
              ],
              2.5,
              'D',
            ),
            choice(
              'What is the author’s purpose of writing the text?',
              [
                'To explain wild parrots’ behavior.',
                'To give advice on raising a parrot.',
                'To call for action to protect animals.',
                'To introduce a study on bird ecology.',
              ],
              2.5,
              'B',
            ),
          ],
        ),
        material(
          `#C
In his 1936 work How to Win Friends and Influence People, Dale Carnegie wrote: “I have come to the conclusion that there is only one way to get the best of an argument—and that is to avoid it.” This distaste for arguments is common, but it depends on a mistaken view of arguments that causes problems for our personal and social lives—and in many ways misses the point of arguing in the first place.
Carnegie would be right if arguments were fights, which is how we often think of them. Like physical fights, verbal（言语的）fights can leave both sides bloodied. Even when you win, you end up no better off. You would be feeling almost as bad if arguments were even just competitions—like, say, tennis tournaments. Pairs of opponents hit the ball back and forth until one winner comes out from all who entered. Everybody else loses. This kind of thinking explains why so many people try to avoid arguments.
However, there are ways to win an argument every time. When you state your position, formulate（阐述）an argument for what you claim and honestly ask yourself whether your argument is any good. When you talk with someone who takes a stand, ask them to give you a reason for their view and spell out their argument fully. Assess its strength and weakness. Raise objections（异议）and listen carefully to their replies. This method will require effort, but practice will make you better at it.
These tools can help you win every argument—not in the unhelpful sense of beating your opponents but in the better sense of learning about what divides people, learning why they disagree with us and learning to talk and work together with them. If we readjust our view of arguments—from a verbal fight or tennis game to a reasoned exchange through which we all gain respect and understanding from each other—then we change the very nature of what it means to “win” an argument.`,
          [
            choice(
              'What is the author’s attitude toward Carnegie’s understanding of argument?',
              ['Critical.', 'Supportive.', 'Tolerant.', 'Uncertain.'],
              2.5,
              'A',
            ),
            choice(
              'Why do many people try to avoid arguments?',
              [
                'They lack debating skills.',
                'They may feel bad even if they win.',
                'They fear being ignored.',
                'They are not confident in themselves.',
              ],
              2.5,
              'B',
            ),
            choice(
              'What does the underlined phrase “spell out” in paragraph 3 probably mean?',
              ['Defend.', 'Explain.', 'Conclude.', 'Repeat.'],
              2.5,
              'B',
            ),
            choice(
              'What is the key to “winning” an argument according to the author?',
              [
                'Sense of logic.',
                'Solid supporting evidence.',
                'Proper manners.',
                'Understanding from both sides.',
              ],
              2.5,
              'D',
            ),
          ],
        ),
        material(
          `#D
For lots of kids, toddlerhood（幼儿期）is an important time for friendship. Studies show that the earlier kids learn to form positive relationships, the better they are at relating to others as teenagers and adults. Playing together also helps these kids practice social behaviors, such as kindness, sharing, and cooperation.
Even so, how quickly your child develops into a social creature may also depend on his temperament（性格）. Some toddlers are very social, but others are shy. In addition, the way that toddlers demonstrate that they like other children is markedly different from what adults think of as expressions of friendship. Research at Ohio State University in Columbus found that a toddler’s way of saying “I like you” during play is likely to come in the form of copying a friend’s behavior.
This seemingly unusual way of demonstrating fondness can result in unpleasant behavior. Regardless of how much they like a playmate, they may still grab his toys, refuse to share, and get bossy. But experts say that this is a normal and necessary part of friendship for kids this age. Through play experiences, toddlers learn social rules. That’s why it’s so important to take an active role in your toddler’s social encounters by setting limits and offering frequent reminders of what they are. When you establish these guidelines, explain the reasons behind them.
Begin by helping your child learn sympathy（“Ben is crying. What’s making him so sad?”）, then suggest how he could resolve the problem（“Maybe he would feel better if you let him play with the ball.”）. When your child shares or shows empathy（同理心）toward a friend, praise him（“Ben stopped crying! You made him feel better.”）.
Another way to encourage healthy social interaction is by encouraging kids to use words—not fists—to express how they feel. It’s also important to be mindful of how your child’s personality affects playtime. Kids are easy to get angry when they’re sleepy or hungry, so schedule playtime when they’re refreshed.`,
          [
            choice(
              'What does it indicate when toddlers copy their playmates’ behavior?',
              [
                'They are interested in acting.',
                'They are shy with the strangers.',
                'They are fond of their playmates.',
                'They are tired of playing games.',
              ],
              2.5,
              'C',
            ),
            choice(
              'What does the author suggest parents do for their kids?',
              [
                'Design games for them.',
                'Find them suitable playmates.',
                'Play together with them.',
                'Help them understand social rules.',
              ],
              2.5,
              'D',
            ),
            choice(
              'What is the function of the quoted statements in paragraph 4?',
              ['Giving examples.', 'Explaining concepts.', 'Providing evidence.', 'Making comparisons.'],
              2.5,
              'A',
            ),
            choice(
              'Which of the following is the best title for the text?',
              [
                'How Children Adapt to Changes',
                'How to Be a Role Model for Children',
                'How Your Baby Learns to Love',
                'How to Communicate with Your Kid',
              ],
              2.5,
              'C',
            ),
          ],
        ),
        readingQuestion(
          'sevenChoice',
          `#Common Mistakes New Runners Make
Running is a great way to get in shape and just about everyone can do it. However, many make a number of common mistakes, which can interfere（妨碍）with training or lead to injury. ____36____, keep these things in mind to help you increase your chances of running success.
• Doing too much too soon
One of the biggest mistakes new runners make is doing too much too soon. Slowly easing into a training program will help reduce the risk of injury, so you can continue on with your new running routine. ____37____
• ____38____
Beginners might think they need to run every day（or nearly every day）to meet their fitness or weight-loss goals, but this couldn’t be further from the truth. Running is a high-impact activity which can be really hard on your body. So it’s important to give your body a rest between workouts.
• Not wearing the right equipment
____39____, it’s important that you wear properly for your workouts. The most important piece of equipment for running is a good pair of running shoes, so be sure to do some research before you purchase a pair. Visit a running specialty store and ask an employee to fit you for a shoe.
• Running through pain
____40____. If something hurts when you run, you need to stop and treat the pain.
Remember: It doesn’t make you less of a runner if you listen to your body to keep it healthy.
A. Not taking rest days
B. If you’re just starting out
C. Comparing yourself to others
D. Running can be uncomfortable at times
E. It’s important not to use the same muscles
F. While it may be true that you don’t need expensive equipment to take up running
G. Experts suggest increasing your running distance by no more than 10% each week`,
          ['B', 'G', 'A', 'F', 'D'].map((answer) => ({ answer, score: 2.5, options: [] })),
          {
            stem: '第二节（共5小题；每小题2.5分，满分12.5分）\n阅读下面短文，从短文后的选项中选出可以填入空白处的最佳选项。选项中有两项为多余选项。',
          },
        ),
      ],
    },
    {
      ...createSection('语言运用', '共两节，满分30分。'),
      questions: [
        readingQuestion(
          'cloze',
          `I was halfway across Indiana headed home to Kentucky when my car broke down. My phone was ____41____ too. I managed to get to a gas station, but it was Sunday in the early fall, and there was no ____42____ on duty. I was working my way through university then and had little money for ____43____ the car.
I sat alongside my car for several hours trying to ____44____ the heat when an older gentleman ____45____ to fuel his car. He asked about my car, and I ____46____ my predicament（困境）. To my ____47____, the gentleman told me that he had a daughter my age, and then he opened his trunk and ____48____ a tool set.
Right then and there, this total ____49____ examined my engine, explaining as he worked that my spark plugs（火花塞）hadn’t been changed for so long that they were ____50____ to function. After about an hour, he ____51____ that my car was safe to finish the trip.
____52____ came at the hands of a stranger. ____53____ his clothes, working on a hot September afternoon, this man ____54____ a college student from disaster, just because she could have been his ____55____.`,
          ([
            ['C', ['busy', 'loud', 'dead', 'secure']],
            ['A', ['mechanic', 'policeman', 'manager', 'guide']],
            ['D', ['washing', 'parking', 'purchasing', 'maintaining']],
            ['B', ['feel', 'beat', 'absorb', 'produce']],
            ['C', ['promised', 'refused', 'stopped', 'volunteered']],
            ['D', ['solved', 'noticed', 'escaped', 'explained']],
            ['A', ['surprise', 'regret', 'amusement', 'disappointment']],
            ['B', ['called up', 'pulled out', 'put down', 'threw away']],
            ['C', ['liar', 'beginner', 'stranger', 'loser']],
            ['D', ['free', 'ready', 'uncertain', 'unable']],
            ['A', ['pronounced', 'agreed', 'discovered', 'doubted']],
            ['B', ['Tiredness', 'Kindness', 'Loneliness', 'Carefulness']],
            ['C', ['Folding', 'Drying', 'Soiling', 'Mending']],
            ['A', ['saved', 'called', 'judged', 'banned']],
            ['B', ['friend', 'daughter', 'coworker', 'customer']],
          ] as Array<[string, string[]]>).map(([answer, options]) => ({ answer, score: 1, options })),
          {
            stem: '第一节（共15小题；每小题1分，满分15分）\n阅读下面短文，从每题所给的A、B、C、D四个选项中选出最佳选项。',
          },
        ),
        material(
          `Whenever you have to write a paper, a letter, or any other document for work or school, you probably head toward the computer. Now, most people reach for ____56____（keyboard）faster than they pick up pens. In a Scottish primary school, however, Mr. Norman Lewis is taking a different approach. He feels that neat handwriting ____57____（be）still an important skill, so he has his students write not only by hand but also ____58____ old-fashioned fountain pens.
Fountain pens ____59____（use）in schools long ago and have been regaining popularity lately because they are refillable. Today, a writer ____60____（simple）throws an empty pen away and gets ____61____ new one.
So far, Mr. Lewis is pleased with the results of his experiment. He reports that his students are taking more care with their work, and their self-confidence has improved as well.
He is happy with the ____62____（improve）he sees in his students’ writing ____63____ in his own writing. He knows that computers are here ____64____（stay）and that they will not disappear. However, he believes that the practice with fountain pens helps students to focus, to write faster, and they can feel proud of ____65____（they）.`,
          [
            'keyboards',
            'is',
            'with',
            'were used',
            'simply',
            'a',
            'improvement',
            'and',
            'to stay',
            'themselves',
          ].map((answer, index) =>
            question({
              type: 'fill',
              stem: `第${56 + index}空`,
              score: 1.5,
              answer,
            }),
          ),
          {
            stem: '第二节（共10小题；每小题1.5分，满分15分）\n阅读下面短文，在空白处填入1个适当的单词或括号内单词的正确形式。',
          },
        ),
      ],
    },
    {
      ...createSection('写作', '共两节，满分40分。'),
      questions: [
        question({
          type: 'composition',
          stem: '第一节（满分15分）\n你校英文报计划举办主题为“携手行动，节约粮食”的作文比赛。请你写一则活动通知，内容包括：\n（1）介绍活动目的；\n（2）说明参赛要求。\n注意：\n（1）写作词数应为80个左右；\n（2）请按如下格式在答题卡的相应位置作答。\nWelcome to Join the English Writing Competition',
          score: 15,
          answer: '',
          answerLines: 0,
          compositionStyle: 'lines',
        }),
        material(
          `Last summer, Hilda worked as a volunteer with dolphin trainers at a sea life park. Her job was to make sure the tanks were free of any items so that the trainers could train the dolphins to fetch specific items. However, one day after cleaning, one of the dolphins, Maya, presented Hilda with a candy wrapper from the tank. When Katherine, the trainer, saw this, she blamed Hilda for her carelessness. Upset but not discouraged by this event, Hilda decided to do some spying on Maya.
The next morning, Hilda arrived at the park early. She put on her scuba gear（水下呼吸器）and jumped into the tank for her usual, underwater sweep. Finding nothing in the tank, she climbed out of the water just in time to see Katherine jumping in on the other side. After what happened yesterday, Hilda knew what she was doing. She watched as Katherine performed her underwater search, but Hilda wasn’t surprised when she surfaced empty-handed.
During the tank sweeps, Maya had been swimming playfully, but now the dolphin stopped suddenly and swam to the back part of the tank where the filter（过滤）box was located. She stuck her nose down behind the box and then swam away. What was Maya doing back there? Hilda wondered. She jumped back into the water and swam over to take a look behind the box, and her question was answered. Hilda then swam across the tank following Maya’s path and emerged from the water to find Katherine removing her scuba gear. As Katherine turned around, her mouth dropped open. There was Maya at the edge of the tank with a comb（梳子）in her mouth waiting for her treat.
“Maya! Where did you get that?” demanded Katherine, taking the comb and throwing her a fish. “I know where she got it,” declared Hilda climbing out of the tank with a handful of items still wet from their watery, resting place. “What’s all this?” Katherine asked, obviously confused.`,
          [
            question({
              type: 'composition',
              stem: '注意：\n（1）续写词数应为150个左右；\n（2）请按如下格式在答题卡的相应位置作答。\n“This is Maya’s secret,” Hilda said with a big smile.\nNow Katherine realized what had been going on.',
              score: 25,
              answer: '',
              answerLines: 0,
              compositionStyle: 'lines',
            }),
          ],
          {
            stem: '第二节（满分25分）\n阅读下面材料，根据其内容和所给段落开头语续写两段，使之构成一篇完整的短文。',
          },
        ),
      ],
    },
  ]
  return paper
}
