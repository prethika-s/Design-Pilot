import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import logger from '../config/logger.js';

export const generatePDFReport = async (data) => {
  const { project, requirements, architectures, tradeoffs, decisions } = data;

  try {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([600, 800]);
    let y = 740;
    const margin = 50;
    const width = 500;

    const checkPageBreak = (neededHeight) => {
      if (y - neededHeight < margin) {
        page = pdfDoc.addPage([600, 800]);
        y = 740;
      }
    };

    const drawTextWrapped = (text, x, fontSize, isBold = false, color = rgb(0.2, 0.2, 0.2)) => {
      const activeFont = isBold ? fontBold : font;
      const cleanText = (text || '').replace(/\r?\n/g, ' ');
      const words = cleanText.split(' ');
      let line = '';
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const testWidth = activeFont.widthOfTextAtSize(testLine, fontSize);
        if (testWidth > width - (x - margin) && n > 0) {
          checkPageBreak(fontSize * 1.4);
          page.drawText(line.trim(), { x, y, size: fontSize, font: activeFont, color });
          y -= fontSize * 1.4;
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      
      checkPageBreak(fontSize * 1.4);
      page.drawText(line.trim(), { x, y, size: fontSize, font: activeFont, color });
      y -= fontSize * 1.6;
    };

    const drawDivider = () => {
      checkPageBreak(15);
      page.drawLine({
        start: { x: margin, y },
        end: { x: 600 - margin, y },
        thickness: 1,
        color: rgb(0.85, 0.85, 0.85),
      });
      y -= 20;
    };

    const drawSectionHeader = (title) => {
      checkPageBreak(35);
      y -= 10;
      page.drawRectangle({
        x: margin,
        y: y - 4,
        width,
        height: 22,
        color: rgb(0.08, 0.18, 0.36),
      });
      page.drawText(title, {
        x: margin + 8,
        y: y + 2,
        size: 12,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
      y -= 30;
    };

    // --- TITLE PAGE / HEADER ---
    page.drawRectangle({
      x: 0,
      y: 770,
      width: 600,
      height: 30,
      color: rgb(0.0, 0.6, 0.6), // Vibrant Teal
    });

    page.drawText('ArchitectAI Report', {
      x: margin,
      y: 710,
      size: 24,
      font: fontBold,
      color: rgb(0.08, 0.18, 0.36),
    });

    y = 680;
    drawTextWrapped(`Project: ${project.title}`, margin, 14, true);
    drawTextWrapped(`Generated on: ${new Date().toLocaleDateString()}`, margin, 10, false, rgb(0.5, 0.5, 0.5));
    drawDivider();

    // --- SECTION 1: EXECUTIVE SUMMARY ---
    drawSectionHeader('1. Executive Summary & Product Idea');
    drawTextWrapped(project.ideaText, margin, 11);
    drawDivider();

    // --- SECTION 2: STRUCTURED REQUIREMENTS ---
    drawSectionHeader('2. Structured Requirements');
    if (!requirements || requirements.length === 0) {
      drawTextWrapped('No requirements processed yet.', margin + 10, 11);
    } else {
      // Flatten structuredReq
      const allReqs = [];
      requirements.forEach((req) => {
        req.structuredReq.forEach((sr) => {
          if (!allReqs.some((existing) => existing.title === sr.title)) {
            allReqs.push(sr);
          }
        });
      });

      allReqs.forEach((r) => {
        checkPageBreak(30);
        page.drawText(`[${r.priority}] ${r.title}`, {
          x: margin,
          y,
          size: 10,
          font: fontBold,
          color: rgb(0.08, 0.18, 0.36),
        });
        y -= 14;
        drawTextWrapped(r.description, margin + 10, 9);
        y -= 5;
      });
    }
    drawDivider();

    // --- SECTION 3: ARCHITECTURE OPTIONS ---
    drawSectionHeader('3. Architecture Options');
    if (!architectures || architectures.length === 0) {
      drawTextWrapped('No architectural options evaluated yet.', margin + 10, 11);
    } else {
      architectures.forEach((opt) => {
        checkPageBreak(60);
        const titleText = opt.recommended ? `${opt.type} (RECOMMENDED)` : opt.type;
        page.drawText(titleText, {
          x: margin,
          y,
          size: 11,
          font: fontBold,
          color: opt.recommended ? rgb(0, 0.6, 0.6) : rgb(0.08, 0.18, 0.36),
        });
        y -= 14;

        drawTextWrapped(`Rationale: ${opt.rationale}`, margin + 10, 9);
        drawTextWrapped(`Pros: ${opt.pros.join(', ')}`, margin + 10, 9);
        drawTextWrapped(`Cons: ${opt.cons.join(', ')}`, margin + 10, 9);
        drawTextWrapped(`Team Fit: ${opt.teamFit}`, margin + 10, 9);
        drawTextWrapped(`Scalability: ${opt.scalability}`, margin + 10, 9);
        y -= 10;
      });
    }
    drawDivider();

    // --- SECTION 4: TRADEOFF ANALYSIS ---
    drawSectionHeader('4. Technology Tradeoffs');
    if (!tradeoffs || tradeoffs.length === 0 || !tradeoffs[0].comparisons) {
      drawTextWrapped('No tradeoff analysis generated yet.', margin + 10, 11);
    } else {
      const comparisons = tradeoffs[0].comparisons;
      comparisons.forEach((comp) => {
        checkPageBreak(50);
        page.drawText(comp.technology, {
          x: margin,
          y,
          size: 10,
          font: fontBold,
          color: rgb(0.08, 0.18, 0.36),
        });
        y -= 14;

        const scoreText = `Scores - Cost: ${comp.costScore}/5 | Scalability: ${comp.scalabilityScore}/5 | Complexity: ${comp.complexityScore}/5 | Performance: ${comp.performanceScore}/5`;
        page.drawText(scoreText, {
          x: margin + 10,
          y,
          size: 9,
          font: fontBold,
          color: rgb(0.4, 0.4, 0.4),
        });
        y -= 14;

        drawTextWrapped(`Recommendation: ${comp.recommendation}`, margin + 10, 9, true);
        drawTextWrapped(`Reasoning: ${comp.reasoning}`, margin + 10, 9);
        y -= 5;
      });
    }
    drawDivider();

    // --- SECTION 5: DECISION MEMORY LOG ---
    drawSectionHeader('5. Decision Memory Log');
    if (!decisions || decisions.length === 0) {
      drawTextWrapped('No decision logs recorded yet.', margin + 10, 11);
    } else {
      decisions.forEach((dec) => {
        checkPageBreak(50);
        page.drawText(dec.decision, {
          x: margin,
          y,
          size: 10,
          font: fontBold,
          color: rgb(0.08, 0.18, 0.36),
        });
        y -= 14;

        const auditText = `Decided by: ${dec.decidedBy} | Date: ${new Date(dec.createdAt).toLocaleDateString()}`;
        page.drawText(auditText, {
          x: margin + 10,
          y,
          size: 8,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });
        y -= 12;

        drawTextWrapped(`Rationale: ${dec.rationale}`, margin + 10, 9);
        if (dec.alternatives && dec.alternatives.length > 0) {
          drawTextWrapped(`Rejected Alternatives: ${dec.alternatives.join(', ')}`, margin + 10, 9);
        }
        y -= 5;
      });
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    logger.error(`PDF Generation Error: ${error.message}`);
    throw error;
  }
};
