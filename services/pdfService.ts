import jsPDF from 'jspdf';
import { LaudoForm, Engineer, DamageEntry, BuildingTypology, ZoneType } from '../types';
import { DAMAGE_LOGIC } from '../constants';

const drawHeader = (doc: jsPDF, pageWidth: number, margin: number, logoLeft?: string, logoRight?: string): number => {
  const headerStart = 15;
  const logoBoxSizeRight = 24; 
  const logoBoxSizeLeft = 28; 
  const logoBaseline = headerStart + 17; 
  
  const contentStartX = margin + logoBoxSizeLeft;
  const contentEndX = pageWidth - margin - logoBoxSizeRight;
  const centerX = (contentStartX + contentEndX) / 2;

  let textY = headerStart;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  
  doc.setFont('helvetica', 'bold');
  doc.text('ESTADO DO PARANÁ', centerX, textY, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  textY += 5;
  doc.text('COORDENADORIA ESTADUAL DA DEFESA CIVIL', centerX, textY, { align: 'center' });
  textY += 5;
  doc.text('DIVISÃO DE CONTRATOS, CONVÊNIOS E FUNDOS', centerX, textY, { align: 'center' });
  textY += 5;
  doc.text('FUNDO ESTADUAL PARA CALAMIDADES PÚBLICAS', centerX, textY, { align: 'center' });

  const logoRightX = pageWidth - margin - logoBoxSizeRight;
  if (logoRight) {
     try {
        const props = doc.getImageProperties(logoRight);
        const ratio = props.width / props.height;
        let w = logoBoxSizeRight;
        let h = logoBoxSizeRight;
        if (ratio > 1) h = w / ratio; else w = h * ratio;
        const x = logoRightX + (logoBoxSizeRight - w) / 2;
        const y = logoBaseline - h;
        doc.addImage(logoRight, 'PNG', x, y, w, h);
     } catch(e) { console.warn("Error adding right logo", e); }
  } else {
      doc.setFillColor(234, 88, 12); 
      doc.rect(logoRightX, logoBaseline - logoBoxSizeRight, logoBoxSizeRight, logoBoxSizeRight, 'F');
  }

  const logoLeftX = margin;
  if (logoLeft) {
      try {
        const props = doc.getImageProperties(logoLeft);
        const ratio = props.width / props.height;
        let w = logoBoxSizeLeft;
        let h = logoBoxSizeLeft;
        if (ratio > 1) h = w / ratio; else w = h * ratio;
        const x = logoLeftX + (logoBoxSizeLeft - w) / 2;
        const y = logoBaseline - h;
        doc.addImage(logoLeft, 'PNG', x, y, w, h);
      } catch(e) { console.warn("Error adding left logo", e); }
  }

  return 50; 
};

const drawFooter = (doc: jsPDF, pageNumber: number, totalPages: number, pageWidth: number, pageHeight: number) => {
    const footerHeight = 25;
    const footerY = pageHeight - footerHeight; 
    const barHeight = 4; 
    const slantWidth = 6; 
    const splitRatio = 0.80; 
    const splitX = pageWidth * splitRatio;
    const gapSize = 1.5;

    doc.setFillColor(0, 91, 159); 
    doc.path([{ op: 'm', c: [0, footerY] }, { op: 'l', c: [splitX, footerY] }, { op: 'l', c: [splitX - slantWidth, footerY + barHeight] }, { op: 'l', c: [0, footerY + barHeight] }, { op: 'h' }]);
    doc.fill();
    
    const greenStartX = splitX + gapSize;
    doc.setFillColor(0, 157, 87); 
    doc.path([{ op: 'm', c: [greenStartX, footerY] }, { op: 'l', c: [pageWidth, footerY] }, { op: 'l', c: [pageWidth, footerY + barHeight] }, { op: 'l', c: [greenStartX - slantWidth, footerY + barHeight] }, { op: 'h' }]);
    doc.fill();

    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0); 
    doc.setFont('helvetica', 'normal');
    let textY = footerY + barHeight + 5;
    const centerX = pageWidth / 2;
    doc.text('Palácio das Araucárias - 1º andar - Setor C | Centro Cívico | Curitiba/PR | CEP 80.530-140', centerX, textY, { align: 'center' });
    textY += 4;
    doc.text('E-mail: defesacivil@defesacivil.pr.gov.br | Fone: (41) 3281-2500', centerX, textY, { align: 'center' });
    textY += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('“Defesa Civil somos todos nós”', centerX, textY, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.text(`${pageNumber}/${totalPages}`, pageWidth - 5, pageHeight - 3, { align: 'right' });
};

export const generateLaudoPDF = async (
  data: LaudoForm, 
  selectedEngineer: Engineer,
  mode: 'save' | 'preview' = 'save',
  mapImage?: string
): Promise<string | void> => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  const bottomMargin = 30; 

  let yPos = drawHeader(doc, pageWidth, margin, data.logoEsquerda, data.logoDireita);

  const checkPageBreak = (heightNeeded: number) => {
    if (yPos + heightNeeded > pageHeight - bottomMargin) {
        doc.addPage();
        yPos = drawHeader(doc, pageWidth, margin, data.logoEsquerda, data.logoDireita);
        return true;
    }
    return false;
  };

  const formatValue = (value: string | undefined | null): string => {
    if (!value || value.trim() === '') return 'NÃO INFORMADO';
    return value.toUpperCase();
  };

  yPos += 5; 
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('LAUDO DE IMÓVEL AFETADO POR EVENTO CLIMÁTICO', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos - 5, contentWidth, 8, 'F');
  doc.text('1. LOCALIZAÇÃO E DATA', margin + 2, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.text('MUNICÍPIO:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formatValue(data.municipio), margin + 25, yPos);
  
  const dateLabelX = margin + 100;
  doc.setFont('helvetica', 'bold');
  doc.text('DATA DA VISTORIA:', dateLabelX, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(data.data).toLocaleDateString('pt-BR'), dateLabelX + 40, yPos);

  yPos += 12;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos - 5, contentWidth, 8, 'F');
  doc.text('2. DADOS DO IMÓVEL', margin + 2, yPos);
  yPos += 8;

  doc.setFontSize(10);
  const addField = (label: string, value: string, sameLine = false, xOffset = 0) => {
    doc.setFont('helvetica', 'bold');
    const drawX = margin + xOffset;
    doc.text(label, drawX, yPos);
    const labelWidth = doc.getTextWidth(label);
    doc.setFont('helvetica', 'normal');
    const maxWidth = sameLine ? (contentWidth/2 - labelWidth) : (contentWidth - labelWidth - 2);
    const splitText = doc.splitTextToSize(value, maxWidth);
    doc.text(splitText, drawX + labelWidth + 2, yPos);
    if (!sameLine) yPos += (splitText.length * 5) + 2; 
    return splitText.length;
  };

  addField('ZONA:', formatValue(data.zona));
  if (data.zona === ZoneType.URBANO) {
      addField('INDICAÇÃO FISCAL:', formatValue(data.indicacaoFiscal));
      addField('INSCRIÇÃO MUNICIPAL:', formatValue(data.inscricaoImobiliaria));
      addField('MATRÍCULA:', formatValue(data.matricula));
  } else {
      addField('NIRF / CIB:', formatValue(data.nirfCib));
      addField('INCRA:', formatValue(data.incra));
  }
  addField('PROPRIETÁRIO:', formatValue(data.proprietario));
  addField('REQUERENTE:', formatValue(data.requerente));
  addField('CPF:', formatValue(data.cpfRequerente));
  
  let fullAddress = '';
  if (data.endereco || data.bairro || data.cep) {
      const parts = [];
      if (data.endereco) parts.push(data.endereco);
      if (data.bairro) parts.push(data.bairro);
      if (data.cep) parts.push(data.cep);
      fullAddress = parts.join(', ');
  }
  addField('ENDEREÇO:', formatValue(fullAddress));
  addField('COORDENADAS:', `${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`);
  addField('TIPOLOGIA:', formatValue(data.tipologia === BuildingTypology.OUTRO ? data.tipologiaOutro : data.tipologia));

  yPos += 2; 

  if (mapImage) {
      try {
          // Lógica de Redimensionamento Inteligente
          const MAX_SIZE = 120;
          const MIN_SIZE = 60;
          const availableSpace = (pageHeight - bottomMargin) - yPos - 5;

          let mapSize = MAX_SIZE;
          
          if (availableSpace < MAX_SIZE) {
              if (availableSpace >= MIN_SIZE) {
                  mapSize = availableSpace;
              } else {
                  doc.addPage();
                  yPos = drawHeader(doc, pageWidth, margin, data.logoEsquerda, data.logoDireita);
                  yPos += 10;
                  mapSize = MAX_SIZE;
              }
          }

          const mapX = (pageWidth - mapSize) / 2;
          doc.addImage(mapImage, 'PNG', mapX, yPos, mapSize, mapSize);
          
          // Moldura preta grossa
          doc.setDrawColor(0);
          doc.setLineWidth(1.0); // Moldura de 1mm de espessura
          doc.rect(mapX, yPos, mapSize, mapSize, 'S');
          doc.setLineWidth(0.2); // Reseta para espessura padrão

          const pinX = mapX + (mapSize / 2);
          const pinY = yPos + (mapSize / 2);
          doc.setFillColor(220, 38, 38); 
          doc.setDrawColor(185, 28, 28); 
          doc.circle(pinX, pinY - 5, 3, 'FD');
          doc.triangle(pinX - 3, pinY - 4, pinX + 3, pinY - 4, pinX, pinY, 'FD');
          doc.setFillColor(255, 255, 255);
          doc.circle(pinX, pinY - 5, 1, 'F');
          
          yPos += mapSize + 5;
      } catch(e) { console.error("Failed to embed map", e); }
  }

  doc.addPage();
  yPos = drawHeader(doc, pageWidth, margin, data.logoEsquerda, data.logoDireita);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos - 5, contentWidth, 8, 'F');
  doc.text('3. LEVANTAMENTO DE DANOS', margin + 2, yPos);
  yPos += 10;

  data.danos.forEach((dano, index) => {
    checkPageBreak(30); 
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const title = `3.${index + 1}. ${dano.type.toUpperCase()}: `;
    doc.text(title, margin, yPos);
    const titleWidth = doc.getTextWidth(title);
    doc.setFont('helvetica', 'normal');
    const desc = dano.description || "Sem descrição detalhada.";
    const splitDesc = doc.splitTextToSize(desc, contentWidth - titleWidth);
    doc.text(splitDesc, margin + titleWidth, yPos);
    yPos += (splitDesc.length * 5) + 3;

    if (dano.photos.length > 0) {
      const photoWidth = (contentWidth - 6) / 2;
      const photoHeight = 55;
      const rowHeight = photoHeight + 6;
      for (let i = 0; i < dano.photos.length; i += 2) {
          const p1 = dano.photos[i];
          const p2 = dano.photos[i+1];
          if (yPos + photoHeight > pageHeight - bottomMargin) {
              doc.addPage();
              yPos = drawHeader(doc, pageWidth, margin, data.logoEsquerda, data.logoDireita);
          }
          if (p1) { try { doc.addImage(p1, 'JPEG', margin, yPos, photoWidth, photoHeight); doc.setDrawColor(200); doc.rect(margin, yPos, photoWidth, photoHeight); } catch(e) {} }
          if (p2) { try { doc.addImage(p2, 'JPEG', margin + photoWidth + 6, yPos, photoWidth, photoHeight); doc.setDrawColor(200); doc.rect(margin + photoWidth + 6, yPos, photoWidth, photoHeight); } catch(e) {} }
          yPos += rowHeight;
      }
      yPos += 10;
    } else { yPos += 10; }
  });

  const actionsData = DAMAGE_LOGIC[data.classificacao];
  const parecerText = data.parecerFinal || "";
  const splitParecer = doc.splitTextToSize(parecerText, contentWidth);
  const lineHeight = 7; 
  const textBlocksHeight = 25 + 10 + (splitParecer.length * lineHeight) + 5; 
  const signatureHeight = 35; 
  const preferredSigGap = 35; 
  const minSigGap = 15;       
  const spaceRemainingBlock = pageHeight - bottomMargin - yPos;
  
  let appliedSigGap = preferredSigGap;
  if (spaceRemainingBlock < textBlocksHeight + minSigGap + signatureHeight) {
      doc.addPage();
      yPos = drawHeader(doc, pageWidth, margin, data.logoEsquerda, data.logoDireita);
  } else {
      if (spaceRemainingBlock < textBlocksHeight + preferredSigGap + signatureHeight) {
          appliedSigGap = Math.max(minSigGap, spaceRemainingBlock - textBlocksHeight - signatureHeight);
      }
      yPos += 5; doc.setDrawColor(200); doc.line(margin, yPos, pageWidth - margin, yPos); yPos += 10;
  }

  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setFillColor(240, 240, 240); doc.rect(margin, yPos - 5, contentWidth, 8, 'F');
  doc.text('4. CLASSIFICAÇÃO FINAL', margin + 2, yPos); yPos += 10;
  doc.setFontSize(10); addField('CLASSIFICAÇÃO:', data.classificacao.toUpperCase()); addField('NÍVEL DE DESTRUIÇÃO:', actionsData.level.toUpperCase()); addField('PERCENTUAL ESTIMADO:', actionsData.percent);
  yPos += 8;
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setFillColor(240, 240, 240); doc.rect(margin, yPos - 5, contentWidth, 8, 'F');
  doc.text('5. PARECER TÉCNICO FINAL', margin + 2, yPos); yPos += 10;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.setLineHeightFactor(1.5); doc.text(splitParecer, margin, yPos); doc.setLineHeightFactor(1.15);
  yPos += (splitParecer.length * lineHeight); 

  yPos += appliedSigGap;
  if (selectedEngineer.institution === 'CEDEC') {
      doc.setTextColor(100, 100, 100); doc.setFont('helvetica', 'italic'); doc.setFontSize(9);
      doc.text('Assinado Eletronicamente', pageWidth / 2, yPos - 5, { align: 'center' });
      doc.setTextColor(0, 0, 0); 
  }
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.text(selectedEngineer.name.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
  yPos += 5; doc.setFontSize(10); doc.text('Engenheiro(a) Civil', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5; doc.text(`CREA-${selectedEngineer.state || 'PR'} ${selectedEngineer.crea}`, pageWidth / 2, yPos, { align: 'center' });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawFooter(doc, i, totalPages, pageWidth, pageHeight);
  }

  if (mode === 'save') {
    const cleanText = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const formatDateForFilename = (dateStr: string) => { const p = dateStr.split('-'); return p.length === 3 ? `${p[2]}${p[1]}${p[0]}` : dateStr.replace(/[^0-9]/g, ''); };
    doc.save(`${cleanText(data.municipio)}_${cleanText(data.requerente || 'NAO-INFORMADO')}_${formatDateForFilename(data.data)}.pdf`);
  } else {
    return URL.createObjectURL(doc.output('blob'));
  }
};