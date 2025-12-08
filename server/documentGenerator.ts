import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import ExcelJS from 'exceljs';
import PptxGenJS from 'pptxgenjs';

export async function createWordDocument(vbaCode: string, title: string): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: title || 'VBA Macro Document',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),
        new Paragraph({
          text: 'Được tạo bởi Flaton AI - VBA Document Generator',
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({
              text: 'Được tạo bởi Flaton AI - VBA Document Generator',
              italics: true,
              color: '666666'
            })
          ]
        }),
        new Paragraph({
          text: 'Mã VBA Macro:',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: vbaCode,
              font: 'Consolas',
              size: 20
            })
          ],
          spacing: { line: 360 }
        }),
        new Paragraph({
          text: '',
          spacing: { before: 400 }
        }),
        new Paragraph({
          text: 'Hướng dẫn sử dụng:',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          text: '1. Mở Microsoft Word/Excel/PowerPoint',
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: '2. Nhấn Alt + F11 để mở VBA Editor',
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: '3. Insert > Module để tạo module mới',
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: '4. Copy và dán mã VBA vào module',
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: '5. Nhấn F5 hoặc Run để chạy macro',
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

  sheet.getColumn('A').width = 80;
  sheet.getColumn('B').width = 20;

  sheet.mergeCells('A1:B1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = title || 'VBA Macro Document';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF4F46E5' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 30;

  sheet.mergeCells('A2:B2');
  const subtitleCell = sheet.getCell('A2');
  subtitleCell.value = 'Được tạo bởi Flaton AI - VBA Document Generator';
  subtitleCell.font = { italic: true, size: 10, color: { argb: 'FF666666' } };
  subtitleCell.alignment = { horizontal: 'center' };

  sheet.getCell('A4').value = 'Mã VBA Macro:';
  sheet.getCell('A4').font = { bold: true, size: 12 };

  const codeLines = vbaCode.split('\n');
  let rowIndex = 5;
  
  for (const line of codeLines) {
    const cell = sheet.getCell(`A${rowIndex}`);
    cell.value = line;
    cell.font = { name: 'Consolas', size: 10 };
    cell.alignment = { wrapText: true };
    rowIndex++;
  }

  rowIndex += 2;
  sheet.getCell(`A${rowIndex}`).value = 'Hướng dẫn sử dụng:';
  sheet.getCell(`A${rowIndex}`).font = { bold: true, size: 12 };
  
  const instructions = [
    '1. Mở Microsoft Excel',
    '2. Nhấn Alt + F11 để mở VBA Editor',
    '3. Insert > Module để tạo module mới',
    '4. Copy và dán mã VBA vào module',
    '5. Nhấn F5 hoặc Run để chạy macro'
  ];

  rowIndex++;
  for (const instruction of instructions) {
    sheet.getCell(`A${rowIndex}`).value = instruction;
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

  const slide1 = pptx.addSlide();
  slide1.addText(title || 'VBA Macro Document', {
    x: 0.5,
    y: 2,
    w: 9,
    h: 1,
    fontSize: 36,
    bold: true,
    color: '4F46E5',
    align: 'center'
  });
  slide1.addText('Được tạo bởi Flaton AI', {
    x: 0.5,
    y: 3.2,
    w: 9,
    h: 0.5,
    fontSize: 18,
    color: '666666',
    align: 'center',
    italic: true
  });

  const slide2 = pptx.addSlide();
  slide2.addText('Mã VBA Macro', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 24,
    bold: true,
    color: '1E3A8A'
  });
  
  slide2.addText(vbaCode, {
    x: 0.5,
    y: 1,
    w: 9,
    h: 4.5,
    fontSize: 10,
    fontFace: 'Consolas',
    color: '333333',
    fill: { color: 'F3F4F6' },
    valign: 'top'
  });

  const slide3 = pptx.addSlide();
  slide3.addText('Hướng dẫn sử dụng', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 24,
    bold: true,
    color: '1E3A8A'
  });

  const instructions = [
    { step: '1', text: 'Mở Microsoft PowerPoint' },
    { step: '2', text: 'Nhấn Alt + F11 để mở VBA Editor' },
    { step: '3', text: 'Insert > Module để tạo module mới' },
    { step: '4', text: 'Copy và dán mã VBA vào module' },
    { step: '5', text: 'Nhấn F5 hoặc Run để chạy macro' }
  ];

  let yPos = 1.2;
  for (const instruction of instructions) {
    slide3.addText(`${instruction.step}. ${instruction.text}`, {
      x: 0.5,
      y: yPos,
      w: 9,
      h: 0.5,
      fontSize: 16,
      bullet: false
    });
    yPos += 0.6;
  }

  const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
  return buffer;
}
