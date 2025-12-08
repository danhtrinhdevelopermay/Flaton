import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } from 'docx';
import ExcelJS from 'exceljs';
import PptxGenJS from 'pptxgenjs';

export async function createWordDocument(vbaCode: string, title: string): Promise<Buffer> {
  const codeLines = vbaCode.split('\n');
  
  const codeRows = codeLines.map((line, index) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 500, type: WidthType.DXA },
          shading: { fill: 'E5E7EB', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: String(index + 1),
                  font: 'Consolas',
                  size: 18,
                  color: '6B7280'
                })
              ],
              alignment: AlignmentType.RIGHT
            })
          ]
        }),
        new TableCell({
          shading: { fill: '1F2937', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: line || ' ',
                  font: 'Consolas',
                  size: 18,
                  color: '10B981'
                })
              ]
            })
          ]
        })
      ]
    });
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: title || 'VBA Macro Document',
              bold: true,
              size: 48,
              color: '4F46E5'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Được tạo bởi Flaton AI - VBA Document Generator',
              italics: true,
              size: 22,
              color: '6B7280'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Mã VBA Macro',
              bold: true,
              size: 28,
              color: '1E3A8A'
            })
          ],
          spacing: { before: 300, after: 200 }
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: codeRows
        }),
        new Paragraph({
          text: '',
          spacing: { before: 400 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Hướng dẫn sử dụng',
              bold: true,
              size: 28,
              color: '1E3A8A'
            })
          ],
          spacing: { before: 300, after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ text: '1. Mở Microsoft Word/Excel/PowerPoint', size: 22 })],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [new TextRun({ text: '2. Nhấn Alt + F11 để mở VBA Editor', size: 22 })],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [new TextRun({ text: '3. Insert > Module để tạo module mới', size: 22 })],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [new TextRun({ text: '4. Copy và dán mã VBA vào module', size: 22 })],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [new TextRun({ text: '5. Nhấn F5 hoặc Run để chạy macro', size: 22 })],
          spacing: { after: 100 }
        })
      ]
    }]
  });

  return await Packer.toBuffer(doc);
}

export async function createExcelDocument(vbaCode: string, title: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Flaton AI';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('VBA Macro');

  sheet.getColumn('A').width = 6;
  sheet.getColumn('B').width = 100;

  sheet.mergeCells('A1:B1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = title || 'VBA Macro Document';
  titleCell.font = { bold: true, size: 20, color: { argb: 'FF4F46E5' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
  sheet.getRow(1).height = 40;

  sheet.mergeCells('A2:B2');
  const subtitleCell = sheet.getCell('A2');
  subtitleCell.value = 'Được tạo bởi Flaton AI - VBA Document Generator';
  subtitleCell.font = { italic: true, size: 11, color: { argb: 'FF6B7280' } };
  subtitleCell.alignment = { horizontal: 'center' };
  subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };

  sheet.mergeCells('A4:B4');
  sheet.getCell('A4').value = 'Mã VBA Macro:';
  sheet.getCell('A4').font = { bold: true, size: 14, color: { argb: 'FF1E3A8A' } };

  const codeLines = vbaCode.split('\n');
  let rowIndex = 5;
  
  for (let i = 0; i < codeLines.length; i++) {
    const lineNumCell = sheet.getCell(`A${rowIndex}`);
    lineNumCell.value = i + 1;
    lineNumCell.font = { name: 'Consolas', size: 10, color: { argb: 'FF6B7280' } };
    lineNumCell.alignment = { horizontal: 'right', vertical: 'middle' };
    lineNumCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
    
    const codeCell = sheet.getCell(`B${rowIndex}`);
    codeCell.value = codeLines[i];
    codeCell.font = { name: 'Consolas', size: 10, color: { argb: 'FF10B981' } };
    codeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
    codeCell.alignment = { wrapText: false };
    
    rowIndex++;
  }

  rowIndex += 2;
  sheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
  sheet.getCell(`A${rowIndex}`).value = 'Hướng dẫn sử dụng:';
  sheet.getCell(`A${rowIndex}`).font = { bold: true, size: 14, color: { argb: 'FF1E3A8A' } };
  
  const instructions = [
    '1. Mở Microsoft Excel',
    '2. Nhấn Alt + F11 để mở VBA Editor',
    '3. Insert > Module để tạo module mới',
    '4. Copy và dán mã VBA vào module',
    '5. Nhấn F5 hoặc Run để chạy macro'
  ];

  rowIndex++;
  for (const instruction of instructions) {
    sheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
    sheet.getCell(`A${rowIndex}`).value = instruction;
    sheet.getCell(`A${rowIndex}`).font = { size: 11 };
    rowIndex++;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function createPowerPointDocument(vbaCode: string, title: string): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.author = 'Flaton AI';
  pptx.title = title || 'VBA Macro Presentation';
  pptx.subject = 'VBA Macro Code';
  pptx.layout = 'LAYOUT_WIDE';

  const slide1 = pptx.addSlide();
  slide1.addShape('rect', { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '0F172A' } });
  
  slide1.addText(title || 'VBA Macro', {
    x: 0.5,
    y: 2.2,
    w: 12.3,
    h: 1.2,
    fontSize: 44,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    fontFace: 'Arial'
  });
  
  slide1.addText('Được tạo bởi Flaton AI', {
    x: 0.5,
    y: 3.5,
    w: 12.3,
    h: 0.5,
    fontSize: 18,
    color: '818CF8',
    align: 'center',
    italic: true
  });

  slide1.addShape('rect', { 
    x: 4.5, y: 4.2, w: 4.3, h: 0.08, 
    fill: { color: '6366F1' } 
  });

  const codeLines = vbaCode.split('\n');
  const maxLinesPerSlide = 18;
  const totalSlides = Math.ceil(codeLines.length / maxLinesPerSlide);

  for (let slideNum = 0; slideNum < totalSlides; slideNum++) {
    const codeSlide = pptx.addSlide();
    codeSlide.addShape('rect', { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '1E293B' } });
    
    const pageInfo = totalSlides > 1 ? ` (${slideNum + 1}/${totalSlides})` : '';
    codeSlide.addText(`Mã VBA Macro${pageInfo}`, {
      x: 0.3,
      y: 0.2,
      w: 12.7,
      h: 0.5,
      fontSize: 20,
      bold: true,
      color: '818CF8'
    });

    codeSlide.addShape('rect', { 
      x: 0.3, y: 0.65, w: 12.7, h: 0.03, 
      fill: { color: '334155' } 
    });

    const startLine = slideNum * maxLinesPerSlide;
    const endLine = Math.min(startLine + maxLinesPerSlide, codeLines.length);
    const slideLines = codeLines.slice(startLine, endLine);

    const codeTableData: PptxGenJS.TableRow[] = slideLines.map((line, idx) => {
      const lineNum = startLine + idx + 1;
      return [
        { 
          text: String(lineNum).padStart(3, ' '), 
          options: { 
            fontFace: 'Consolas', 
            fontSize: 9, 
            color: '64748B',
            align: 'right' as const,
            fill: { color: '0F172A' }
          } 
        },
        { 
          text: line || ' ', 
          options: { 
            fontFace: 'Consolas', 
            fontSize: 9, 
            color: '4ADE80',
            fill: { color: '0F172A' }
          } 
        }
      ];
    });

    codeSlide.addTable(codeTableData, {
      x: 0.3,
      y: 0.8,
      w: 12.7,
      colW: [0.5, 12.2],
      border: { pt: 0 },
      fontFace: 'Consolas',
      fontSize: 9
    });
  }

  const instructionSlide = pptx.addSlide();
  instructionSlide.addShape('rect', { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '0F172A' } });
  
  instructionSlide.addText('Hướng dẫn sử dụng', {
    x: 0.5,
    y: 0.3,
    w: 12.3,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: 'FFFFFF'
  });

  instructionSlide.addShape('rect', { 
    x: 0.5, y: 0.9, w: 3, h: 0.05, 
    fill: { color: '6366F1' } 
  });

  const instructions = [
    { num: '01', title: 'Mở ứng dụng Office', desc: 'Mở Microsoft Word, Excel hoặc PowerPoint' },
    { num: '02', title: 'Mở VBA Editor', desc: 'Nhấn Alt + F11 để mở cửa sổ VBA Editor' },
    { num: '03', title: 'Tạo Module mới', desc: 'Vào Insert > Module để tạo module mới' },
    { num: '04', title: 'Dán mã VBA', desc: 'Copy mã VBA từ slide trước và dán vào module' },
    { num: '05', title: 'Chạy Macro', desc: 'Nhấn F5 hoặc Run > Run Sub/UserForm' }
  ];

  let yPos = 1.3;
  instructions.forEach((inst, idx) => {
    instructionSlide.addShape('rect', {
      x: 0.5,
      y: yPos,
      w: 0.6,
      h: 0.6,
      fill: { color: '6366F1' }
    });
    
    instructionSlide.addText(inst.num, {
      x: 0.5,
      y: yPos + 0.1,
      w: 0.6,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: 'FFFFFF',
      align: 'center'
    });

    instructionSlide.addText(inst.title, {
      x: 1.3,
      y: yPos,
      w: 11,
      h: 0.35,
      fontSize: 16,
      bold: true,
      color: 'FFFFFF'
    });

    instructionSlide.addText(inst.desc, {
      x: 1.3,
      y: yPos + 0.3,
      w: 11,
      h: 0.3,
      fontSize: 12,
      color: '94A3B8'
    });

    yPos += 0.85;
  });

  const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
  return buffer;
}
