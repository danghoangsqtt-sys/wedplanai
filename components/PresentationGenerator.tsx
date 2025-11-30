import React from 'react';
import PptxGenJS from 'pptxgenjs';
import { Presentation, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { TaskStatus, GuestGroup } from '../types';

interface PresentationGeneratorProps {
  isCollapsed?: boolean;
}

const PresentationGenerator: React.FC<PresentationGeneratorProps> = ({
  isCollapsed = false
}) => {
  const { user, guests, budgetItems } = useStore();
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Helper: Format Currency
  const fmtMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const generatePPT = async () => {
    setIsGenerating(true);
    
    // Simulate a small delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const pres = new PptxGenJS();
      pres.layout = 'LAYOUT_16x9';
      pres.author = 'WedPlan AI';
      pres.company = 'WedPlan AI';
      pres.subject = 'Kế hoạch đám cưới';
      pres.title = `Kế hoạch cưới - ${user?.displayName || 'Couple'}`;

      // --- COLORS & THEME ---
      const COLOR_PRIMARY = "E11D48"; // Rose 600
      const COLOR_SECONDARY = "9F1239"; // Rose 800
      const COLOR_ACCENT = "F59E0B"; // Amber 500
      const COLOR_TEXT = "374151"; // Gray 700
      const COLOR_BG = "FFF1F2"; // Rose 50
      const COLOR_WHITE = "FFFFFF";

      // --- MASTER SLIDE (THEME) ---
      pres.defineSlideMaster({
        title: "MASTER_SLIDE",
        background: { color: COLOR_WHITE },
        objects: [
          // Top Decorative Bar
          { rect: { x: 0, y: 0, w: "100%", h: 0.15, fill: { color: COLOR_PRIMARY } } },
          // Bottom Bar
          { rect: { x: 0, y: 5.35, w: "100%", h: 0.4, fill: { color: "F3F4F6" } } },
          // Footer Text
          { 
            text: { 
              text: "WedPlan AI - Trợ Lý Cưới Thông Minh", 
              options: { x: 0.3, y: 5.42, fontSize: 10, color: "9CA3AF" } 
            } 
          }
        ],
        // Correct way to add Slide Number
        slideNumber: { x: 9.0, y: 5.42, w: 0.5, h: 0.3, fontSize: 10, color: "9CA3AF", align: "right" }
      });

      // --- DATA PREPARATION ---
      const groomName = user?.displayName || "Chú Rể";
      const brideName = "Cô Dâu"; 
      const weddingDateRaw = user?.weddingDate ? new Date(user.weddingDate) : null;
      const weddingDateStr = weddingDateRaw ? weddingDateRaw.toLocaleDateString('vi-VN') : "Đang cập nhật";

      // Budget Data
      const totalBudget = budgetItems.reduce((acc, i) => acc + i.estimatedCost, 0);
      const totalActual = budgetItems.reduce((acc, i) => acc + i.actualCost, 0);
      const pendingTasks = budgetItems.filter(i => i.status !== TaskStatus.DONE && i.status !== TaskStatus.PAID);
      
      // Guest Data
      const totalGuests = guests.length;
      const confirmedGuests = guests.filter(g => g.probability === 100).length;
      const expectedMoney = guests.reduce((acc, g) => acc + (g.redEnvelope * (g.probability/100)), 0);

      // --- SLIDE 1: TITLE SLIDE ---
      const slide1 = pres.addSlide({ masterName: "MASTER_SLIDE" });
      
      // Decorative Circle
      slide1.addShape(pres.ShapeType.ellipse, { 
        x: 4.1, y: 1.5, w: 1.8, h: 1.8, 
        fill: { color: COLOR_BG }, 
        line: { color: COLOR_PRIMARY, width: 2 } 
      });
      
      slide1.addText("KẾ HOẠCH ĐÁM CƯỚI", { 
        x: 0, y: 2.0, w: "100%", fontSize: 14, color: COLOR_ACCENT, align: 'center', bold: true, charSpacing: 4
      });
      slide1.addText(`${groomName} & ${brideName}`, { 
        x: 0, y: 2.5, w: "100%", fontSize: 44, color: COLOR_PRIMARY, align: 'center', bold: true, fontFace: 'Arial'
      });
      slide1.addText(`Ngày trọng đại: ${weddingDateStr}`, { 
        x: 0, y: 3.5, w: "100%", fontSize: 16, color: COLOR_TEXT, align: 'center', italic: true 
      });

      // --- SLIDE 2: DASHBOARD OVERVIEW ---
      const slide2 = pres.addSlide({ masterName: "MASTER_SLIDE" });
      slide2.addText("TỔNG QUAN TÌNH HÌNH", { x: 0.5, y: 0.5, fontSize: 24, color: COLOR_SECONDARY, bold: true });

      const boxY = 1.5;
      const boxW = 2.1;
      const gap = 0.25;
      const startX = (10 - (boxW * 4 + gap * 3)) / 2;

      const stats = [
        { label: "Tổng Ngân Sách", val: fmtMoney(totalBudget), color: "3B82F6" },
        { label: "Đã Chi Tiêu", val: fmtMoney(totalActual), color: totalActual > totalBudget ? "EF4444" : "10B981" },
        { label: "Khách Mời", val: `${totalGuests} người`, color: "F59E0B" },
        { label: "Việc Cần Làm", val: `${pendingTasks.length} mục`, color: "8B5CF6" }
      ];

      stats.forEach((stat, idx) => {
        const xPos = startX + idx * (boxW + gap);
        // Box Shadow effect manually using two rects if needed, or just standard shadow
        slide2.addShape(pres.ShapeType.roundRect, { 
          x: xPos, y: boxY, w: boxW, h: 1.5, 
          fill: { color: "FFFFFF" }, 
          line: { color: "E5E7EB" }, 
          shadow: { type: 'outer', color: "CCCCCC", blur: 3, offset: 2, angle: 45 } 
        });
        slide2.addText(stat.label, { x: xPos, y: boxY + 0.3, w: boxW, align: 'center', fontSize: 11, color: "6B7280" });
        slide2.addText(stat.val, { x: xPos, y: boxY + 0.7, w: boxW, align: 'center', fontSize: 16, bold: true, color: stat.color });
      });

      // Progress Bar Section
      slide2.addText("Tiến độ hoàn thành công việc:", { x: 0.5, y: 3.6, fontSize: 14, bold: true, color: COLOR_TEXT });
      const completedTasks = budgetItems.length - pendingTasks.length;
      const percent = budgetItems.length > 0 ? Math.round((completedTasks / budgetItems.length) * 100) : 0;
      
      slide2.addShape(pres.ShapeType.rect, { x: 0.5, y: 4.0, w: 9, h: 0.4, fill: { color: "F3F4F6" }, line: { color: "E5E7EB" }, r: 0.2 });
      if (percent > 0) {
        slide2.addShape(pres.ShapeType.rect, { x: 0.5, y: 4.0, w: 9 * (percent/100), h: 0.4, fill: { color: COLOR_PRIMARY }, r: 0.2 });
      }
      slide2.addText(`${percent}%`, { x: 8.8, y: 4.0, w: 0.7, h: 0.4, fontSize: 12, color: percent > 90 ? "FFFFFF" : COLOR_PRIMARY, bold: true, align: 'center', valign: 'middle' });


      // --- SLIDE 3: FINANCIAL BREAKDOWN ---
      const slide3 = pres.addSlide({ masterName: "MASTER_SLIDE" });
      slide3.addText("CHI TIẾT NGÂN SÁCH", { x: 0.5, y: 0.5, fontSize: 24, color: COLOR_SECONDARY, bold: true });

      const budgetByCategory: Record<string, {est: number, act: number}> = {};
      budgetItems.forEach(item => {
        if (!budgetByCategory[item.category]) budgetByCategory[item.category] = {est: 0, act: 0};
        budgetByCategory[item.category].est += item.estimatedCost;
        budgetByCategory[item.category].act += item.actualCost;
      });

      // Table Header
      const budgetRows: any[] = [
        [
          { text: "DANH MỤC", options: { fill: COLOR_SECONDARY, color: "FFFFFF", bold: true, fontFace: "Arial" } },
          { text: "DỰ KIẾN (VNĐ)", options: { fill: COLOR_SECONDARY, color: "FFFFFF", bold: true, align: 'right' } },
          { text: "THỰC TẾ (VNĐ)", options: { fill: COLOR_SECONDARY, color: "FFFFFF", bold: true, align: 'right' } },
          { text: "TRẠNG THÁI", options: { fill: COLOR_SECONDARY, color: "FFFFFF", bold: true, align: 'center' } }
        ]
      ];

      Object.entries(budgetByCategory).forEach(([cat, {est, act}], index) => {
        const diff = est - act;
        const statusText = diff < 0 ? "Vượt chi" : "Ổn định";
        const statusColor = diff < 0 ? "EF4444" : "10B981";
        const rowFill = index % 2 === 0 ? "FFFFFF" : "FFF1F2"; // Zebra striping

        budgetRows.push([
          { text: cat, options: { fill: rowFill, color: COLOR_TEXT } },
          { text: fmtMoney(est), options: { fill: rowFill, color: COLOR_TEXT, align: 'right' } },
          { text: fmtMoney(act), options: { fill: rowFill, color: COLOR_TEXT, align: 'right', bold: true } },
          { text: statusText, options: { fill: rowFill, color: statusColor, align: 'center', bold: true, fontSize: 10 } }
        ]);
      });

      // Add Total Row
      budgetRows.push([
        { text: "TỔNG CỘNG", options: { fill: "F3F4F6", bold: true } },
        { text: fmtMoney(totalBudget), options: { fill: "F3F4F6", bold: true, align: 'right' } },
        { text: fmtMoney(totalActual), options: { fill: "F3F4F6", bold: true, align: 'right', color: totalActual > totalBudget ? "DC2626" : "059669" } },
        { text: "-", options: { fill: "F3F4F6", align: 'center' } }
      ]);

      slide3.addTable(budgetRows, {
        x: 0.5, y: 1.2, w: 9.0,
        border: { pt: 0.5, color: "E5E7EB" },
        autoPage: true,
        margin: 0.1,
        fontSize: 11
      });

      // --- SLIDE 4: GUEST ANALYSIS (WITH CHART) ---
      const slide4 = pres.addSlide({ masterName: "MASTER_SLIDE" });
      slide4.addText("PHÂN TÍCH KHÁCH MỜI", { x: 0.5, y: 0.5, fontSize: 24, color: COLOR_SECONDARY, bold: true });

      // Calculate Groups
      const guestGroups: Record<string, number> = {};
      Object.values(GuestGroup).forEach(g => guestGroups[g] = 0);
      guests.forEach(g => { if (guestGroups[g.group] !== undefined) guestGroups[g.group]++; });

      // Guest Summary Text Box
      slide4.addShape(pres.ShapeType.rect, { x: 0.5, y: 1.2, w: 4.0, h: 3.5, fill: { color: "F8FAFC" }, line: { color: "E2E8F0" } });
      slide4.addText("THỐNG KÊ CHI TIẾT", { x: 0.7, y: 1.4, fontSize: 14, bold: true, color: "334155" });
      slide4.addText([
        { text: `• Tổng số khách: ${totalGuests}`, options: { breakLine: true } },
        { text: `• Đã xác nhận: ${confirmedGuests} (${Math.round(totalGuests > 0 ? (confirmedGuests/totalGuests)*100 : 0)}%)`, options: { breakLine: true, color: "059669" } },
        { text: `• Tiền mừng dự kiến:`, options: { breakLine: true, bold: true, inset: 10 } },
        { text: `  ${fmtMoney(expectedMoney)} VNĐ`, options: { breakLine: true, color: "D97706", fontSize: 16, bold: true } }
      ], { x: 0.7, y: 1.8, w: 3.6, h: 2.5, fontSize: 12, color: "475569", lineSpacing: 24 });

      // CHART: Guest Distribution
      const chartData = [
        {
          name: "Khách mời",
          labels: Object.keys(guestGroups),
          values: Object.values(guestGroups)
        }
      ];
      
      slide4.addChart(pres.ChartType.doughnut, chartData, {
        x: 5.0, y: 1.2, w: 4.5, h: 3.5,
        showLegend: true,
        legendPos: 'r',
        chartColors: ['3B82F6', 'EC4899', 'F59E0B', '8B5CF6'], // Blue, Pink, Amber, Purple
        dataLabelColor: 'FFFFFF',
        showPercent: true,
        holeSize: 40
      });


      // --- SLIDE 5: WEDDING TIMELINE (AUTO-GENERATED) ---
      // Filter tasks that sound like events (contain "Lễ", "Tiệc", "Chụp", "Rước")
      const eventKeywords = ["lễ", "tiệc", "rước", "chụp", "trang điểm", "ăn hỏi"];
      const timelineEvents = budgetItems
        .filter(i => eventKeywords.some(kw => i.itemName.toLowerCase().includes(kw)))
        .slice(0, 5); // Limit to top 5 for space

      if (timelineEvents.length > 0) {
         const slide5 = pres.addSlide({ masterName: "MASTER_SLIDE" });
         slide5.addText("KỊCH BẢN & SỰ KIỆN CHÍNH", { x: 0.5, y: 0.5, fontSize: 24, color: COLOR_SECONDARY, bold: true });

         timelineEvents.forEach((event, idx) => {
            const yPos = 1.3 + (idx * 0.7);
            // Bullet Point
            slide5.addShape(pres.ShapeType.ellipse, { x: 0.6, y: yPos + 0.1, w: 0.15, h: 0.15, fill: { color: COLOR_PRIMARY } });
            // Connecting Line
            if (idx < timelineEvents.length - 1) {
               slide5.addShape(pres.ShapeType.line, { x: 0.675, y: yPos + 0.25, w: 0, h: 0.55, line: { color: "E5E7EB", width: 2 } });
            }
            // Content
            slide5.addText(event.itemName, { x: 1.0, y: yPos, fontSize: 14, bold: true, color: "1F2937" });
            slide5.addText(`${event.assignee || 'Chưa phân công'} | ${event.side === 'GROOM' ? 'Nhà Trai' : event.side === 'BRIDE' ? 'Nhà Gái' : 'Cả hai'}`, 
              { x: 1.0, y: yPos + 0.3, fontSize: 10, color: "6B7280", italic: true });
            
            // Note bubble
            if (event.note) {
               slide5.addShape(pres.ShapeType.roundRect, { x: 6.5, y: yPos, w: 3.0, h: 0.5, fill: { color: "FEF2F2" }, line: { color: "FECDD3" } });
               slide5.addText(event.note, { x: 6.6, y: yPos, w: 2.8, h: 0.5, fontSize: 9, color: "9F1239", valign: 'middle' });
            }
         });
      }

      // --- SLIDE 6: URGENT TASKS ---
      const slide6 = pres.addSlide({ masterName: "MASTER_SLIDE" });
      slide6.addText("CÔNG VIỆC CẦN LÀM GẤP", { x: 0.5, y: 0.5, fontSize: 24, color: "DC2626", bold: true });

      const urgentItems = pendingTasks
        .sort((a, b) => {
           if (!a.deadline) return 1;
           if (!b.deadline) return -1;
           return a.deadline.localeCompare(b.deadline);
        })
        .slice(0, 7);

      if (urgentItems.length > 0) {
        const taskRows = urgentItems.map(item => {
           const deadlineStr = item.deadline ? new Date(item.deadline).toLocaleDateString('vi-VN') : "Sớm nhất";
           return { 
              text: `[${deadlineStr}] ${item.itemName}`, 
              options: { color: "374151", bullet: { code: "2022" } } 
           };
        });
        
        slide6.addText(taskRows, {
          x: 0.5, y: 1.2, w: 9.0, h: 3.5,
          fontSize: 14, lineSpacing: 28, paraSpaceAfter: 10
        });
        
        slide6.addText("Hãy hoàn thành sớm để tránh phát sinh chi phí!", { x: 0.5, y: 4.8, fontSize: 12, italic: true, color: "DC2626" });
      } else {
        slide6.addText("Tuyệt vời! Hiện tại không có công việc nào quá hạn.", { x: 0.5, y: 2.0, fontSize: 18, color: "059669", align: 'center' });
      }

      // --- SLIDE 7: THANK YOU ---
      const slide7 = pres.addSlide();
      slide7.background = { color: COLOR_PRIMARY };
      // Center Box
      slide7.addShape(pres.ShapeType.rect, { x: 1.5, y: 1.5, w: 7, h: 2.5, fill: { color: "FFFFFF", transparency: 90 }, line: { color: "FFFFFF", width: 2 } });
      
      slide7.addText("CẢM ƠN!", { 
        x: 0, y: 2.0, w: "100%", fontSize: 40, color: "FFFFFF", align: 'center', bold: true, fontFace: 'Arial' 
      });
      slide7.addText("Chúc hai bạn trăm năm hạnh phúc", { 
        x: 0, y: 3.0, w: "100%", fontSize: 16, color: "FECDD3", align: 'center', italic: true 
      });
      slide7.addText(`Created by WedPlan AI - ${new Date().toLocaleDateString('vi-VN')}`, { 
        x: 0, y: 5.0, w: "100%", fontSize: 10, color: "FFFFFF", align: 'center', transparency: 50 
      });

      // Save
      const fileName = `Ke_Hoach_Cuoi_${user?.displayName?.replace(/\s+/g, '_') || 'Wedding'}.pptx`;
      await pres.writeFile({ fileName });

    } catch (error) {
      console.error(error);
      alert("Có lỗi khi tạo file PowerPoint. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePPT}
      disabled={isGenerating}
      title="Tạo Slide PowerPoint Kế Hoạch"
      className={`
        relative overflow-hidden group flex items-center gap-2 
        bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 
        text-white rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed
        ${isCollapsed ? 'p-3 justify-center' : 'px-4 py-3 w-full'}
      `}
    >
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
      
      {isGenerating ? (
        <Loader2 className="w-5 h-5 animate-spin relative z-10" />
      ) : (
        <Presentation className="w-5 h-5 relative z-10" />
      )}
      
      {!isCollapsed && (
        <span className="truncate relative z-10">
          {isGenerating ? 'Đang thiết kế...' : 'Xuất Slide Kế Hoạch'}
        </span>
      )}
    </button>
  );
};

export default PresentationGenerator;