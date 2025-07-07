// Sample decks defined as markdown - much cleaner and consistent with our markdown-based architecture
export const sampleMarkdownDecks = [
  {
    id: 'math-basics',
    name: 'Elementary Math Fun',
    markdown: `What is 2 + 2? :: 4
What is 6 + 7? :: 13
What is 7 + 8? :: 15
What is 9 - 4? :: 5
What is 15 - 8? :: 7
What is 5 × 3? :: 15
What is 4 × 2? :: 8
What is 12 ÷ 3? :: 4
3 + 4 equals 7 :: true
6 × 2 equals 12 :: true

# Optional: Add multiple choice when needed
What is 3 × 4?
- 10
- 11
- 12
> 12

Which number is bigger?
- 5
- 10
- 3
- 7
> 10`
  },
  {
    id: 'science-animals',
    name: 'Amazing Animals',
    markdown: `What is the largest mammal? :: The blue whale
How many hearts does an octopus have? :: Three hearts
What sound does a lion make? :: Roar
What is a baby kangaroo called? :: Joey
What color is a polar bear's skin? :: Black
How many legs does a spider have? :: Eight legs
What do bees make? :: Honey
Penguins can fly :: false
Elephants are afraid of mice :: false

# Multiple choice examples
What do pandas eat?
- Fish
- Bamboo
- Meat
- Berries
> Bamboo

Which animal is known for its black and white stripes?
- Horse
- Zebra
- Cow
- Dog
> Zebra

Which bird cannot fly but can swim very well?
- Eagle
- Penguin
- Sparrow
- Owl
> Penguin`
  },
  {
    id: 'space-exploration',
    name: 'Space Adventure',
    markdown: `What is the closest star to Earth? :: The Sun
How many planets are in our solar system? :: Eight planets
Which is the largest planet? :: Jupiter
Which planet has the most moons? :: Saturn
What is the hottest planet? :: Venus
How many moons does Earth have? :: One moon
What causes day and night on Earth? :: Earth's rotation
How long does it take Earth to orbit the Sun? :: One year
What is at the center of our solar system? :: The Sun
What are asteroids made of? :: Rock and metal
What is a comet? :: A ball of ice and dust
The sun is a planet :: false
Saturn has rings :: true
Humans have walked on Mars :: false

# Multiple choice example
Which planet is known as the Red Planet?
- Venus
- Mars
- Jupiter
- Mercury
> Mars`
  },
  {
    id: 'vietnamese-animals',
    name: 'Động Vật Việt Nam',
    markdown: `Con gì có vằn đen trắng? :: Con ngựa vằn (Zebra)
Vua của rừng là con gì? :: Con hổ (Tiger)
Con voi có cái gì rất dài? :: Cái vòi (Trunk)
Con khỉ thích ăn gì? :: Quả chuối (Banana)
Con rắn di chuyển như thế nào? :: Bò lúc lỏn (Slithering)
Con gì bay cao trên trời? :: Con đại bàng (Eagle)
Con chim nào không bay được? :: Con cánh cụt (Penguin)
Con gà trống kêu vào lúc nào? :: Sáng sớm (Early morning)
Con chim nào thông minh nhất? :: Con vẹt (Parrot)
Con gì canh giữ nhà? :: Con chó (Dog)
Con mèo thích ăn gì? :: Cá (Fish)
Con gì cho sữa? :: Con bò (Cow)
Con lợn ở đâu? :: Chuồng lợn (Pig pen)
Hổ là loài ăn cỏ :: false
Voi sợ chuột :: false
Khỉ có đuôi dài :: true`
  },
  {
    id: 'vietnamese-colors',
    name: 'Màu Sắc Việt Nam',
    markdown: `Màu của máu là gì? :: Màu đỏ (Red)
Màu của lá cây? :: Màu xanh lá cây (Green)
Màu của bầu trời? :: Màu xanh da trời (Blue)
Màu của mặt trời? :: Màu vàng (Yellow)
Màu của tuyết? :: Màu trắng (White)
Màu của đêm tối? :: Màu đen (Black)
Quả chuối chín có màu gì? :: Màu vàng
Cỏ có màu gì? :: Màu xanh lá cây
Hoa hồng thường có màu gì? :: Màu đỏ hoặc màu hồng
Cơm trắng có màu gì? :: Màu trắng
Cà chua có màu gì? :: Màu đỏ
Cà rốt có màu gì? :: Màu cam
Tuyết có màu đỏ :: false
Lá cây có màu xanh :: true
Mặt trời có màu tím :: false

# Multiple choice example
Quả cam có màu gì?
- Màu đỏ
- Màu cam
- Màu vàng
- Màu xanh
> Màu cam`
  },
  {
    id: 'vietnamese-math',
    name: 'Toán Học Tiếng Việt',
    markdown: `Hai cộng hai bằng mấy? :: Bốn (4)
Ba cộng năm bằng mấy? :: Tám (8)
Sáu cộng bảy bằng mấy? :: Mười ba (13)
Một cộng chín bằng mấy? :: Mười (10)
Mười trừ ba bằng mấy? :: Bảy (7)
Chín trừ năm bằng mấy? :: Bốn (4)
Tám trừ tám bằng mấy? :: Không (0)
Ba nhân bốn bằng mấy? :: Mười hai (12)
Năm nhân hai bằng mấy? :: Mười (10)
Tám chia hai bằng mấy? :: Bốn (4)
Mười hai chia ba bằng mấy? :: Bốn (4)
Sau số năm là số mấy? :: Số sáu (6)
Trước số mười là số mấy? :: Số chín (9)
Hai cộng ba bằng năm :: đúng (true)
Bốn nhân hai bằng chín :: sai (false)
Mười chia năm bằng hai :: đúng (true)

# Multiple choice example
Hai nhân ba bằng mấy?
- Năm
- Sáu
- Bảy
- Tám
> Sáu`
  },
  {
    id: 'english-vietnamese-practice',
    name: 'English-Vietnamese Practice',
    tags: ['simple-qa', 'vocabulary', 'true-false', 'multiple-choice'],
    markdown: `# Vocabulary
Hello :: Xin chào
Goodbye :: Tạm biệt
Book :: Sách
Water :: Nước

# True/False
"School" is "Trường học" in Vietnamese. :: true
"Cat" is "Con bò" in Vietnamese. :: false
"Red" is "Màu đỏ" in Vietnamese. :: true
"Yellow" is "Màu xanh" in Vietnamese. :: false

# Multiple Choice: Eng-Vie
Which word means "book"?
- Vở
- Bút
- Sách
- Thước
> Sách

Which of these means "to eat"?
- Ăn
- Uống
- Ngủ
- Học
> Ăn

# Multiple Choice: Vie-Eng
What is "màu đỏ"?
- Blue
- Green
- Red
- Yellow
> Red

What does "bác sĩ" mean?
- Teacher
- Doctor
- Engineer
- Student
> Doctor`
  },
  {
    id: 'vietnamese-history-geography',
    name: 'Lịch sử & Địa lý Việt Nam',
    tags: ['history', 'simple-qa', 'true-false', 'geography', 'multiple-choice'],
    markdown: `# Lịch sử
Vị vua nào đã dời đô từ Hoa Lư về Thăng Long?
:: Lý Công Uẩn (Lý Thái Tổ)

Chiến dịch Hồ Chí Minh kết thúc vào ngày 30/04/1975. :: true

# Địa lý
Đỉnh núi cao nhất Việt Nam là gì?
- Fansipan
- Phú Sĩ
- Everest
- Bạch Mã
> Fansipan

Hang động tự nhiên lớn nhất thế giới ở Việt Nam có tên là gì? :: Hang Sơn Đoòng`
  },
  {
    id: 'vietnamese-festivals',
    name: 'Lễ hội Việt Nam',
    tags: ['festival', 'culture', 'simple-qa', 'multiple-choice'],
    markdown: `# Tết Nguyên Đán
Tết Nguyên Đán là lễ hội quan trọng nhất của Việt Nam. :: true
Bánh chưng là món ăn không thể thiếu trong dịp Tết ở miền Bắc. :: true

# Tết Trung Thu
Tết Trung Thu còn được gọi là gì?
- Tết Thiếu nhi
- Tết Trông Trăng
- Tết Đoàn viên
- Tất cả các đáp án trên
> Tất cả các đáp án trên`
  },
  {
    id: 'vietnamese-traditional-crafts',
    name: 'Làng nghề Truyền thống',
    tags: ['craft', 'culture', 'simple-qa', 'true-false', 'multiple-choice'],
    markdown: `# Gốm sứ
Làng gốm Bát Tràng thuộc thành phố nào? :: Hà Nội

# Lụa
Làng lụa Vạn Phúc nổi tiếng với sản phẩm lụa tơ tằm. :: true

# Tranh dân gian
Làng tranh Đông Hồ thuộc tỉnh nào?
- Hà Nam
- Bắc Ninh
- Hải Dương
- Hưng Yên
> Bắc Ninh`
  },
  {
    id: 'famous-vietnamese-people',
    name: 'Danh nhân Việt Nam',
    tags: ['history', 'people', 'simple-qa', 'true-false', 'science', 'multiple-choice'],
    markdown: `# Lãnh tụ
Chủ tịch Hồ Chí Minh đọc bản Tuyên ngôn Độc lập tại đâu? :: Quảng trường Ba Đình, Hà Nội

# Tướng lĩnh
Đại tướng Võ Nguyên Giáp là tổng tư lệnh của Quân đội Nhân dân Việt Nam trong chiến dịch Điện Biên Phủ. :: true

# Nhà khoa học
Giáo sư Tôn Thất Tùng nổi tiếng trong lĩnh vực nào?
- Toán học
- Vật lý
- Y học (phẫu thuật gan)
- Hóa học
> Y học (phẫu thuật gan)`
  },
  {
    id: 'vietnamese-folktales',
    name: 'Truyện cổ tích Việt Nam',
    tags: ['folktale', 'culture', 'simple-qa', 'true-false', 'multiple-choice'],
    markdown: `# Tấm Cám
Trong truyện Tấm Cám, con vật nào đã giúp Tấm nhặt thóc? :: Con chim sẻ

# Cây tre trăm đốt
Câu thần chú trong truyện Cây tre trăm đốt là "Khắc nhập, khắc xuất". :: true

# Sự tích Hồ Gươm
Ai là người đã trả lại gươm báu cho Rùa Vàng?
- Lê Lợi
- Lê Lai
- Trần Hưng Đạo
- Nguyễn Trãi
> Lê Lợi`
  },
  {
    id: 'basic-vietnamese-grammar',
    name: 'Ngữ pháp Tiếng Việt Cơ bản',
    tags: ['grammar', 'language', 'simple-qa', 'true-false', 'multiple-choice'],
    markdown: `# Cấu trúc câu
Trật tự từ cơ bản trong câu khẳng định của Tiếng Việt là gì? :: Chủ ngữ - Vị ngữ - Tân ngữ (SVO)

# Từ loại
"Đẹp" là một tính từ. :: true

# Đại từ
Đại từ nhân xưng ngôi thứ nhất số ít trang trọng là gì?
- Tôi
- Tao
- Mình
- Tớ
> Tôi`
  }
];

// Simple markdown template - shows the basic format
export const sampleMarkdown = `What is 2 + 2? :: 4
What is 5 + 3? :: 8
What is 10 + 10? :: 20
What is 10 - 5? :: 5
What is 8 - 3? :: 5
What is 7 - 4? :: 3
3 + 4 equals 7 :: true
10 - 2 equals 7 :: false
5 × 2 equals 10 :: true

# Optional: Add multiple choice when needed
Tom has 3 apples. Sarah gives him 2 more. How many apples does Tom have now?
- 4 apples
- 5 apples
- 6 apples
- 7 apples
> 5 apples

There are 8 birds on a tree. 3 fly away. How many are left? :: 5 birds`;