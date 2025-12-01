
import { ProcedureStep, WeddingRegion } from "../types";

const COMMON_DAM_NGO: ProcedureStep = {
  id: "dam-ngo",
  title: "Lễ Dạm Ngõ (Chạm Ngõ)",
  description: "Buổi gặp mặt chính thức đầu tiên. Giai đoạn này là lúc thiết lập ngân sách và kế hoạch tổng thể.",
  meaning: "Nhà trai đến nhà gái đặt vấn đề chính thức cho đôi uyên ương tìm hiểu nhau kỹ càng hơn. Đây là bước khởi đầu quan trọng, 'đầu xuôi đuôi lọt'.",
  participants: "Nội bộ gia đình (Bố mẹ, Ông bà, Cô dì chú bác ruột thịt). Số lượng ít (5-7 người mỗi bên).",
  offerings: ["Trầu cau (bắt buộc)", "Chai rượu ngoại/Vang", "Hộp chè (trà) ngon", "Bánh kẹo/Hoa quả cao cấp"],
  taboos: [
    "Tuyệt đối kiêng làm vỡ đồ đạc (cốc chén, gương) trong buổi lễ, coi là điềm tan vỡ.",
    "Tránh đi vào ngày giờ sát chủ, không vong.",
    "Người đang có đại tang không nên tham gia đoàn dạm ngõ.",
    "Không nên mời người ngoài dòng tộc tham dự để giữ sự riêng tư."
  ],
  tips: [
    "💰 **Quản lý tài chính & Ngân sách:**\n- Áp dụng quy tắc 50/30/20: 50% cho Tiệc & Cỗ, 30% cho Dịch vụ (Quay, Chụp, Trang trí, Lễ phục), 20% dự phòng phát sinh.\n- Lập file Excel hoặc dùng App này để track từng khoản nhỏ nhất (kể cả tiền taxi, lì xì).\n- Thống nhất ai chi khoản nào ngay từ đầu: Thường nhà trai lo Nhẫn, Xe, Tráp; Nhà gái lo Trang trí nhà gái; Tiệc nhà nào nhà nấy trả (hoặc chia đôi nếu chung).",
    "💍 **Mẹo chọn Nhẫn Cầu Hôn & Nhẫn Cưới:**\n- **Nhẫn Cầu Hôn:** Không nhất thiết phải kim cương tự nhiên. Đá Moissanite có độ sáng 98% kim cương nhưng giá chỉ bằng 1/10. Chọn kiểu Solitaire (1 viên chủ) là kinh điển nhất.\n- **Nhẫn Cưới:** Nên chọn vàng 14K hoặc 18K (cứng, bền hơn 24K). Tránh mẫu quá nhiều đá nhỏ dễ rơi khi đeo hàng ngày. Nên mua sớm khi có đợt sale (Valentine, 8/3) để tiết kiệm 10-20%.\n- **Đo size tay:** Lấy sợi chỉ quấn quanh ngón tay lúc bình thường (không quá nóng/lạnh) rồi đo chiều dài.",
    "🤝 **Phân công công việc:**\n- Lập nhóm chat Zalo chung cho BTC đám cưới (Bố mẹ 2 bên + CDCR).\n- **Bố mẹ:** Lo danh sách khách mời người lớn, làm việc với họ hàng.\n- **CDCR:** Lo tìm nhà cung cấp (chụp ảnh, makeup), khách mời bạn bè, kịch bản chương trình."
  ],
  scriptSuggestion: "Kính thưa hai họ, hôm nay ngày lành tháng tốt, nhà trai chúng tôi có cơi trầu chai rượu sang thưa chuyện với nhà gái, xin phép cho hai cháu [Tên CR] và [Tên CĐ] được chính thức qua lại tìm hiểu...",
  tasks: [
    { itemName: "Mua quà dạm ngõ (Trầu cau, Rượu, Chè)", category: "Lễ Dạm Ngõ", estimatedCost: 1500000, assignee: "Nhà Trai", side: "GROOM" },
    { itemName: "Dọn dẹp, trang trí bàn thờ gia tiên", category: "Lễ Dạm Ngõ", estimatedCost: 500000, assignee: "Nhà Gái", side: "BRIDE" },
    { itemName: "Đặt tiệc cơm thân mật mời nhà trai", category: "Lễ Dạm Ngõ", estimatedCost: 3000000, assignee: "Nhà Gái", side: "BRIDE" },
    { itemName: "Xem ngày lành tháng tốt cho Lễ Ăn Hỏi", category: "Lễ Dạm Ngõ", estimatedCost: 500000, assignee: "Nhà Trai", side: "GROOM" }
  ]
};

const COMMON_TIEC_CUOI: ProcedureStep = {
  id: "tiec-cuoi",
  title: "Tiệc Cưới (Đãi Khách)",
  description: "Tiệc chiêu đãi khách mời. Phần tốn kém và phức tạp nhất.",
  meaning: "Ra mắt họ hàng, bạn bè xã hội, công bố sự thành đôi của hai bạn.",
  participants: "Toàn bộ khách mời (Bạn bè, Đồng nghiệp, Họ hàng).",
  offerings: ["Tháp ly Champagne", "Bánh kem cưới", "Nhẫn cưới"],
  taboos: [
    "Kiêng mời cưới sát ngày (nên mời trước 2 tuần).",
    "Cô dâu kiêng xuất hiện trước khách quá sớm khi chưa làm lễ (tùy quan điểm).",
    "Tránh xếp chỗ những người có xích mích ngồi chung bàn.",
    "Kiêng để bàn tiệc trống quá nhiều (nên confirm khách kỹ)."
  ],
  tips: [
    "🏨 **Bí kíp chọn Nhà Hàng & Deal giá 'Không bị hớ':**\n- **Thời điểm đi xem:** Hãy đến lúc họ đang tổ chức một tiệc cưới thật. Để xem ánh sáng, âm thanh, thái độ phục vụ và *đặc biệt là cỗ có đầy đặn không*.\n- **Hỏi kỹ các loại phí:** Phí phục vụ (5-10%?), Phí mang rượu từ ngoài vào (Corkage charge), Phí giờ quá giờ, Phí màn hình LED.\n- **Deal khuyến mãi:** Thay vì xin giảm giá bàn (khó), hãy xin tặng: Tháp ly, Bánh kem, MC, Vũ đoàn, Màn hình LED, Nước ngọt miễn phí.\n- **Hợp đồng:** Ghi rõ 'Không tăng giá thực đơn nếu nguyên liệu tăng'.",
    "🚌 **Bố trí xe & Chỗ ở khách xa:**\n- Nếu đón dâu xa (>50km), nên thuê xe giường nằm hoặc xe du lịch rộng rãi.\n- Book khách sạn gần nhà hàng tiệc cưới cho họ hàng nghỉ ngơi thay đổi trang phục.\n- Chuẩn bị đồ ăn nhẹ (bánh mì, sữa, nước suối) trên xe vì mọi người sẽ rất đói.",
    "🛡️ **Quản lý Tiền Mừng (Cực Quan Trọng):**\n- Chuẩn bị thùng tiền có khóa chắc chắn.\n- **Phân công 1 người ruột thịt** (Chị gái/Em gái/Mẹ) chỉ có nhiệm vụ duy nhất là canh thùng tiền. Tuyệt đối không rời mắt kể cả khi chụp ảnh.\n- Sau tiệc, gom tiền vào túi đen, di chuyển thẳng về nhà hoặc cất vào két sắt khách sạn, không đếm tiền tại sảnh tiệc đông người."
  ],
  scriptSuggestion: "Hôm nay, trước sự chứng kiến của hai bên gia đình và quý vị quan khách, chúng tôi xin tuyên bố hai con chính thức nên vợ thành chồng. Xin nâng ly chúc mừng hạnh phúc...",
  tasks: [
    { itemName: "Chốt thực đơn & Số lượng bàn tiệc", category: "Tiệc Cưới", estimatedCost: 0, assignee: "Cả hai nhà", side: "BOTH" },
    { itemName: "Thanh toán chi phí tiệc cưới (Hậu cần)", category: "Tiệc Cưới", estimatedCost: 100000000, assignee: "Cả hai nhà", side: "BOTH" },
    { itemName: "In và phát thiệp mời (Trước 2-3 tuần)", category: "Tiệc Cưới", estimatedCost: 3000000, assignee: "Cả hai", side: "BOTH" },
    { itemName: "Thuê MC, Ban nhạc, Vũ đoàn", category: "Tiệc Cưới", estimatedCost: 5000000, assignee: "Nhà Trai", side: "BOTH" },
    { itemName: "Đặt thợ chụp ảnh phóng sự cưới", category: "Ảnh & Phim", estimatedCost: 7000000, assignee: "Cô Dâu & Chú Rể", side: "BOTH" },
    { itemName: "Mua quà cảm ơn khách (Door gift)", category: "Tiệc Cưới", estimatedCost: 3000000, assignee: "Cô Dâu", side: "BOTH" },
    { itemName: "Chuẩn bị video/slide ảnh cưới chiếu màn hình", category: "Tiệc Cưới", estimatedCost: 2000000, assignee: "Chú Rể", side: "BOTH" }
  ]
};

export const WEDDING_PROCEDURES: Record<WeddingRegion, ProcedureStep[]> = {
  NORTH: [
    COMMON_DAM_NGO,
    {
      id: "an-hoi-bac",
      title: "Lễ Ăn Hỏi (Miền Bắc)",
      description: "Nhà trai mang sính lễ sang nhà gái. Giai đoạn cần lo toan nhiều nhất về hậu cần.",
      meaning: "Lễ đính ước quan trọng nhất. Sau lễ này, hai bạn được coi là vợ chồng chưa cưới.",
      participants: "Bố mẹ, Ông bà, Đội bê tráp (Nam thanh Nữ tú), Họ hàng.",
      offerings: [
        "Số lượng tráp Lẻ: 5, 7, 9 hoặc 11.",
        "Tráp Trầu cau (Quan trọng nhất - 'Miếng trầu là đầu câu chuyện').",
        "Tráp Rượu thuốc (3 chai rượu, 3 tút thuốc).",
        "Tráp Chè (Trà) Tân Cương.",
        "Tráp Bánh Cốm/Phu Thê (xếp hình tháp).",
        "Tráp Hoa quả kết rồng phượng.",
        "Lợn sữa quay (thường đi với lễ 9 tráp trở lên)."
      ],
      taboos: [
        "Cô dâu tuyệt đối không được xuất hiện/nhìn ra ngoài trước khi chú rể vào đón/gọi cửa.",
        "Kiêng cưới hỏi vào năm Kim Lâu (tuổi âm của cô dâu).",
        "Đội bê tráp kiêng làm rơi tráp (điềm gãy gánh).",
        "Kiêng may áo dài ăn hỏi màu quá tối hoặc quá sặc sỡ không phù hợp."
      ],
      tips: [
        "🎁 **Mẹo chuẩn bị Mâm Lễ (Tráp):**\n- **Tiết kiệm:** Chọn gói tráp cơ bản, thay vì dùng hoa tươi nhập khẩu đắt tiền thì dùng hoa lụa cao cấp hoặc hoa nội địa.\n- **Đẹp đội hình:** Tháp bia/nước ngọt nên chọn loại lon cao, xếp tháp sẽ thanh thoát hơn. Tráp hoa quả nên có nho, táo, xoài (màu sắc tươi sáng).\n- **Tráp Rượu Thuốc:** Nên dùng rượu vang (màu đỏ may mắn) hoặc Vodka (giá mềm, chai đẹp).",
        "👥 **Thuê người & Dịch vụ:**\n- **Đội bê tráp:** Có thể nhờ bạn bè (tiết kiệm tiền thuê, chỉ mất tiền lì xì) nhưng rủi ro giờ giấc cao. Thuê dịch vụ trọn gói (Sinh viên) sẽ đảm bảo đồng phục đẹp, chiều cao đồng đều và chuyên nghiệp hơn.\n- **Makeup:** Bắt buộc phải book lịch 'Test Makeup' trước ngày cưới để xem tone có hợp không. Đừng để đến ngày cưới mới mặt mộc cho thợ vẽ.",
        "🌸 **Trang trí tại nhà (Tư gia):**\n- Backdrop chụp ảnh có thể tự làm bằng khung gỗ + voan + hoa lụa (mua Shopee) để tiết kiệm 50% so với thuê.\n- Nếu thuê rạp, hãy đo kỹ kích thước vỉa hè/sân, tránh lấn chiếm lòng đường gây rắc rối với chính quyền."
      ],
      scriptSuggestion: "Kính thưa các cụ, các ông các bà. Hôm nay ngày lành tháng tốt, nhà trai chúng tôi xin dâng các lễ vật gồm... để xin hỏi cưới cháu [Tên CĐ] cho cháu [Tên CR]...",
      tasks: [
        { itemName: "Đặt tráp ăn hỏi (5-7-9 lễ)", category: "Lễ Ăn Hỏi", estimatedCost: 8000000, assignee: "Nhà Trai", side: "GROOM" },
        { itemName: "Chuẩn bị tiền đen (Lễ nạp tài)", category: "Lễ Ăn Hỏi", estimatedCost: 10000000, assignee: "Nhà Trai", side: "GROOM" },
        { itemName: "Thuê đội bê tráp & Lì xì trả duyên", category: "Lễ Ăn Hỏi", estimatedCost: 3000000, assignee: "Cả hai nhà", side: "BOTH" },
        { itemName: "Thuê xe ô tô chở đoàn ăn hỏi", category: "Lễ Ăn Hỏi", estimatedCost: 3000000, assignee: "Nhà Trai", side: "GROOM" },
        { itemName: "Trang trí phông bạt tại nhà gái", category: "Lễ Ăn Hỏi", estimatedCost: 5000000, assignee: "Nhà Gái", side: "BRIDE" },
        { itemName: "Trang điểm cô dâu & Mẹ (Ăn hỏi)", category: "Trang Phục", estimatedCost: 2000000, assignee: "Cô Dâu", side: "BRIDE" },
        { itemName: "Thuê thợ chụp ảnh lễ ăn hỏi", category: "Ảnh & Phim", estimatedCost: 3000000, assignee: "Cả hai nhà", side: "BOTH" }
      ]
    },
    {
      id: "xin-dau-bac",
      title: "Lễ Xin Dâu",
      description: "Mẹ chú rể sang nhà gái trước giờ đón dâu để báo cáo gia tiên.",
      meaning: "Lời xin phép chính thức để được đón cô dâu về nhà chồng đúng giờ hoàng đạo.",
      participants: "Mẹ chú rể và một bác gái thân thiết (mang cơi trầu).",
      offerings: ["Cơi trầu xin dâu (Trầu, cau, chai rượu nhỏ)"],
      taboos: ["Mẹ chú rể kiêng đi cùng đoàn đón dâu chính thức (ở một số nơi, mẹ đi trước để tránh xung khắc)."],
      tips: ["Nên đến trước đoàn đón dâu khoảng 30-45 phút.", "Mẹ chú rể nên ăn mặc trang trọng."],
      scriptSuggestion: "Tôi đại diện nhà trai xin phép gia đình nhà gái cho đoàn đón dâu được vào làm lễ...",
      tasks: [
        { itemName: "Chuẩn bị cơi trầu xin dâu", category: "Lễ Cưới", estimatedCost: 300000, assignee: "Mẹ Chú Rể", side: "GROOM" }
      ]
    },
    {
      id: "ruoc-dau-bac",
      title: "Lễ Rước Dâu (Đón Dâu)",
      description: "Đoàn nhà trai chính thức đón cô dâu về nhà chồng.",
      meaning: "Cô dâu chính thức về nhà chồng, bắt đầu cuộc sống hôn nhân.",
      participants: "Đoàn đại biểu nhà trai, Cô dâu Chú rể, Bố mẹ đưa dâu.",
      offerings: ["Hoa cưới cầm tay", "Xe hoa"],
      taboos: [
        "Cô dâu ra khỏi nhà không được ngoái đầu nhìn lại (sợ vương vấn, khóc lóc).",
        "Mẹ đẻ kiêng đưa con gái về nhà chồng (sợ cảnh chia ly buồn).",
        "Kiêng rước dâu đi đường cũ (nếu có thể thì đi đường vòng để tránh điều không may, mang ý nghĩa mới mẻ)."
      ],
      tips: [
        "💐 **Hoa Cưới & Ý Nghĩa:**\n- **Hoa Hồng đỏ:** Tình yêu cháy bỏng. **Hoa Baby:** Sự ngây thơ, thuần khiết. **Hoa Rum:** Sự thanh cao, sang trọng.\n- Nên chọn 2 bó hoa: 1 bó chính để chụp ảnh làm lễ (hoa nhập khẩu), 1 bó phụ để ném (hoa nội địa giá rẻ hơn).",
        "🚗 **Xe Hoa & Di chuyển:**\n- Chọn màu xe: Trắng (trẻ trung, hiện đại), Đen (Sang trọng, quyền lực).\n- Trang trí xe hoa: Dùng hoa giả cao cấp (bền, không nát khi đi gió) sẽ đẹp hơn hoa tươi héo rũ khi đi đường xa.\n- **Lưu ý:** Chú rể nên chuẩn bị sẵn ô (dù) trong xe, phòng khi trời nắng/mưa lúc đón cô dâu xuống xe.",
        "🏠 **Phòng Tân Hôn:**\n- Thay toàn bộ Chăn - Ga - Gối - Đệm mới. Kiêng dùng lại đồ cũ.\n- Không để gương chiếu thẳng vào giường ngủ.\n- Nhờ một người phụ nữ 'tốt vía' (gia đình hạnh phúc, có nếp có tẻ) trải ga giường giúp để lấy may."
      ],
      scriptSuggestion: "Xin phép ông bà tổ tiên cho cháu [Tên CĐ] về làm dâu con nhà họ [Họ CR]...",
      tasks: [
        { itemName: "Thuê xe hoa (Xe đón dâu)", category: "Lễ Cưới", estimatedCost: 5000000, assignee: "Nhà Trai", side: "GROOM" },
        { itemName: "Thuê xe chở họ hàng (16-45 chỗ)", category: "Lễ Cưới", estimatedCost: 4000000, assignee: "Nhà Trai", side: "GROOM" },
        { itemName: "Hoa cầm tay cô dâu & Hoa cài áo", category: "Lễ Cưới", estimatedCost: 1500000, assignee: "Chú Rể", side: "GROOM" },
        { itemName: "Trang trí phòng tân hôn (Giường/Tủ)", category: "Nhà Cửa", estimatedCost: 10000000, assignee: "Nhà Trai", side: "GROOM" },
        { itemName: "Chuẩn bị tiền lẻ rải đường", category: "Lễ Cưới", estimatedCost: 200000, assignee: "Mẹ Chú Rể", side: "GROOM" },
        { itemName: "Quay phim chụp ảnh lễ đón dâu", category: "Ảnh & Phim", estimatedCost: 8000000, assignee: "Cả hai nhà", side: "BOTH" }
      ]
    },
    COMMON_TIEC_CUOI,
    {
      id: "lai-mat-bac",
      title: "Lễ Lại Mặt (Nhị Hỷ)",
      description: "Vợ chồng mới cưới về thăm nhà gái sau 1-3 ngày.",
      meaning: "Thể hiện chữ Hiếu, chú rể cảm ơn bố mẹ vợ đã gả con gái.",
      participants: "Cô dâu, Chú rể.",
      offerings: ["Gà luộc/Chân giò", "Gạo nếp", "Rượu/Bánh kẹo", "Phong bì biếu bố mẹ"],
      taboos: ["Kiêng về lại mặt khi trời đã tối muộn (nên về buổi sáng, ăn cơm trưa)."],
      tips: ["Nên chuẩn bị quà cáp chu đáo cho bố mẹ vợ và anh chị em nhà vợ."],
      scriptSuggestion: "Con chào bố mẹ, hôm nay vợ chồng con về thăm nhà...",
      tasks: [
        { itemName: "Mua quà/Phong bì lại mặt", category: "Sau Cưới", estimatedCost: 2000000, assignee: "Chú Rể", side: "GROOM" },
        { itemName: "Sắp xếp xe cộ về quê vợ", category: "Sau Cưới", estimatedCost: 1000000, assignee: "Chú Rể", side: "GROOM" }
      ]
    }
  ],
  CENTRAL: [
    COMMON_DAM_NGO,
    {
      id: "an-hoi-trung",
      title: "Lễ Ăn Hỏi (Miền Trung)",
      description: "Đơn giản, trọng lễ nghi. Bắt buộc có Cặp nến tơ hồng.",
      meaning: "Lễ Tơ Hồng là quan trọng nhất, cầu mong ông Tơ bà Nguyệt se duyên bền chặt.",
      participants: "Bố mẹ, Họ hàng, Người mai mối.",
      offerings: [
        "Mâm trầu cau.",
        "Bánh phu thê (Su sê).",
        "Cặp nến tơ hồng (Quan trọng nhất - khắc rồng phượng).",
        "Rượu trà.",
        "Bánh kem (thường thấy ở Đà Nẵng)."
      ],
      taboos: [
        "Kiêng kỵ người có tang, phụ nữ mang thai đi họ.",
        "Kiêng làm tắt nến tơ hồng khi đang làm lễ."
      ],
      tips: [
        "🕯️ **Cặp Nến Tơ Hồng (Quan Trọng):**\n- Phải ướm thử nến vào chân nến trên bàn thờ nhà gái trước ngày lễ. Rất nhiều trường hợp mang nến sang nhưng chân nến nhà gái quá nhỏ hoặc quá to không cắm vừa, gây lúng túng.\n- Chọn người thắp nến phải là người có gia đình êm ấm, 'mát tay'.",
        "🎁 **Lễ Vật Miền Trung:**\n- Không quá cầu kỳ số lượng tráp (thường 5 tráp) nhưng chất lượng phải tốt. Bánh phu thê gói lá dừa là đặc trưng đẹp mắt.\n- Có thể thêm 'Heo quay' nếu muốn long trọng hơn."
      ],
      scriptSuggestion: "Mời người cao tuổi nhất trong họ thắp cặp nến tơ hồng lên bàn thờ, khấn vái tổ tiên chứng giám.",
      tasks: [
        { itemName: "Mua cặp nến tơ hồng (Long Phụng)", category: "Lễ Ăn Hỏi", estimatedCost: 500000, assignee: "Nhà Trai", side: "GROOM" },
        { itemName: "Đặt bánh phu thê (Su sê)", category: "Lễ Ăn Hỏi", estimatedCost: 2000000, assignee: "Nhà Trai", side: "GROOM" },
        { itemName: "Chuẩn bị mâm quả trầu cau", category: "Lễ Ăn Hỏi", estimatedCost: 1000000, assignee: "Nhà Trai", side: "GROOM" },
        { itemName: "Thuê xe đưa đón họ hàng", category: "Lễ Ăn Hỏi", estimatedCost: 3000000, assignee: "Nhà Trai", side: "GROOM" },
        { itemName: "Trang điểm cô dâu (Ăn hỏi)", category: "Trang Phục", estimatedCost: 1500000, assignee: "Cô Dâu", side: "BRIDE" }
      ]
    },
    {
      id: "ruoc-dau-trung",
      title: "Lễ Rước Dâu (Đón Dâu)",
      description: "Có thể đi bộ rước dâu nếu gần.",
      meaning: "Đưa nàng về dinh.",
      participants: "Hai họ.",
      offerings: [],
      taboos: ["Mẹ chồng không đi đón dâu (để tránh xung khắc mẹ chồng nàng dâu sau này - quan niệm cũ)."],
      tips: [
        "🚶 **Rước dâu đi bộ:** Nếu hai nhà gần nhau, rước dâu đi bộ là một nét đẹp rất riêng. Hãy chuẩn bị đội hình: Người cầm lọng (dù) đỏ đi đầu, đến CDCR, rồi đến bố mẹ và họ hàng. Chụp ảnh sẽ rất đẹp và tình cảm.",
        "💍 **Trao nhẫn & Nữ trang:**\n- Miền Trung thường trao vàng ngay trong lễ rước dâu tại nhà gái. Mẹ chồng đeo bông tai cho con dâu là nghi thức 'Nhận dâu' không thể thiếu."
      ],
      scriptSuggestion: "Xin dâu, bái tổ đường, rước dâu về.",
      tasks: [
        { itemName: "Thuê xe hoa đón dâu", category: "Lễ Cưới", estimatedCost: 4000000, assignee: "Nhà Trai", side: "GROOM" },
        { itemName: "Mua nhẫn cưới", category: "Trang Sức", estimatedCost: 10000000, assignee: "Chú Rể", side: "GROOM" },
        { itemName: "Chuẩn bị phòng tân hôn", category: "Nhà Cửa", estimatedCost: 5000000, assignee: "Nhà Trai", side: "GROOM" },
        { itemName: "May áo dài truyền thống (Cô dâu)", category: "Trang Phục", estimatedCost: 2000000, assignee: "Cô Dâu", side: "BRIDE" }
      ]
    },
    COMMON_TIEC_CUOI
  ],
  SOUTH: [
    COMMON_DAM_NGO,
    {
      id: "an-hoi-nam",
      title: "Lễ Đính Hôn (Đám Hỏi)",
      description: "Số tráp CHẴN (6, 8, 10). Quan trọng nhất là Lễ Lên Đèn.",
      meaning: "Người miền Nam coi trọng sự có đôi có cặp (số chẵn). Lễ Lên Đèn là khoảnh khắc thiêng liêng nhất.",
      participants: "Gia đình hai bên, Chủ hôn (người nói chuyện hay).",
      offerings: [
        "Số tráp Chẵn: 6, 8 hoặc 10 (phổ biến là 6 hoặc 8).",
        "Tráp Trầu cau (105 quả - 'trăm năm hạnh phúc').",
        "Cặp đèn cầy (Nến) khắc rồng phượng loại lớn (Bắt buộc).",
        "Heo quay (nguyên con).",
        "Bánh Su sê (gói hình vuông).",
        "Trang sức cho cô dâu (Bông tai, Vòng cổ)."
      ],
      taboos: [
        "Kỵ nhất là đang làm Lễ Lên Đèn mà nến bị tắt (điềm cực xấu). Phải đóng cửa sổ, tắt quạt.",
        "Trầu cau phải chọn buồng đẹp, không được cắt ngọn.",
        "Người bưng quả không được làm rớt quả."
      ],
      tips: [
        "🕯️ **Lễ Lên Đèn:**\n- Đây là nghi thức quan trọng nhất miền Nam. Hai ngọn nến phải cháy đều, sáng tỏ. Nhà trai nên chuẩn bị dư 1 cặp nến dự phòng để tránh rủi ro gãy/tắt.\n- Chủ hôn phải hô to: 'Lên đèn!', hai người đại diện châm lửa dứt khoát.",
        "🐷 **Heo quay & Lễ vật:**\n- Heo quay thường là nguyên con. Khi nhà gái 'lại quả' (trả lễ), sẽ cắt 1/2 con heo (phần đầu và đuôi) trả lại nhà trai. Nhớ chuẩn bị dao sắc và giấy gói bạc/túi nilon sạch để chia lễ nhanh gọn."
      ],
      scriptSuggestion: "Trưởng tộc nhà trai: 'Hôm nay chúng tôi xin dâng cặp đèn cầy long phụng để bái yết gia tiên...'. Hai bên cùng thắp nến.",
      tasks: [
        { itemName: "Mua cặp đèn cầy rồng phượng loại lớn", category: "Lễ Đính Hôn", estimatedCost: 1500000, assignee: "Nhà Trai", side: "GROOM" },
        { itemName: "Đặt Heo quay nguyên con", category: "Lễ Đính Hôn", estimatedCost: 4000000, assignee: "Nhà Trai", side: "GROOM" },
        { itemName: "Đặt tráp trầu cau 105 quả", category: "Lễ Đính Hôn", estimatedCost: 1000000, assignee: "Nhà Trai", side: "GROOM" },
        { itemName: "Tiền nạp tài (Tiền dẫn cưới)", category: "Lễ Đính Hôn", estimatedCost: 15000000, assignee: "Nhà Trai", side: "GROOM" },
        { itemName: "Thuê người bưng quả (số chẵn)", category: "Lễ Đính Hôn", estimatedCost: 3000000, assignee: "Cả hai nhà", side: "BOTH" },
        { itemName: "Chuẩn bị chân nến trên bàn thờ", category: "Lễ Đính Hôn", estimatedCost: 0, assignee: "Nhà Gái", side: "BRIDE" }
      ]
    },
    {
      id: "ruoc-dau-nam",
      title: "Lễ Vu Quy & Tân Hôn",
      description: "Lễ Vu Quy (nhà gái) và Tân Hôn (nhà trai). Trao vàng vòng rôm rả.",
      meaning: "Đón cô dâu về. Miền Nam tính cách phóng khoáng, nghi thức vui vẻ, nhiều tiếng cười.",
      participants: "Hai họ, bạn bè.",
      offerings: ["Bông tai (Mẹ chồng đeo cho nàng dâu)", "Vàng cưới (Kiềng, Vòng, Lắc)"],
      taboos: [
        "Mẹ ruột cô dâu không đưa dâu về nhà chồng (chỉ tiễn ra cửa, tránh khóc lóc).",
        "Kỵ đổ vỡ ly tách trong tiệc."
      ],
      tips: [
        "💰 **Vàng Cưới & Trang Sức:**\n- Người miền Nam rất trọng việc trao vàng. Nếu ngân sách hạn hẹp, có thể thuê bộ trang sức cưới (vàng 10k/14k) chỉ để làm lễ cho đẹp mặt, sau đó trả lại.\n- Nếu được tặng nhiều vàng, hãy chuẩn bị một túi nhỏ có khóa kéo, giao cho người tin cẩn giữ ngay sau khi làm lễ xong.",
        "🎤 **MC & Không khí:**\n- Đám cưới miền Nam cần vui. Hãy thuê MC biết tấu hài, khuấy động phong trào. Ban nhạc sống (Bolero/Pop) là đặc sản không thể thiếu."
      ],
      scriptSuggestion: "Mời mẹ chồng lên trao tặng đôi bông tai cho cô dâu, mong con dâu ngoan hiền, biết lắng nghe...",
      tasks: [
        { itemName: "Mua bông tai vàng tặng con dâu (Bắt buộc)", category: "Trang Sức", estimatedCost: 5000000, assignee: "Mẹ Chồng", side: "GROOM" },
        { itemName: "Chuẩn bị vàng cưới (Kiềng/Lắc)", category: "Trang Sức", estimatedCost: 50000000, assignee: "Bố Mẹ Hai Bên", side: "BOTH" },
        { itemName: "Trang điểm & Làm tóc cô dâu (Vu Quy)", category: "Trang Phục", estimatedCost: 4000000, assignee: "Cô Dâu", side: "BRIDE" },
        { itemName: "Thuê thợ chụp hình tiệc (Truyền thống)", category: "Ảnh & Phim", estimatedCost: 5000000, assignee: "Cả hai nhà", side: "BOTH" },
        { itemName: "Thuê xe hoa", category: "Lễ Cưới", estimatedCost: 4000000, assignee: "Nhà Trai", side: "GROOM" }
      ]
    },
    COMMON_TIEC_CUOI
  ]
};
