import { jsPDF } from 'jspdf';
import { Rdo, Project, Company } from '../types';

export async function buildRdoPdfDoc(
  rdo: Rdo,
  project?: Project,
  company?: Company
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = 14;
      renderPageHeader();
    }
  };

  const renderPageHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `OBRACERT RDO - ${rdo.rdoNumber} | Obra: ${rdo.projectName} | Data: ${rdo.date}`,
      margin,
      y
    );
    y += 5;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  };

  // --- HEADER PRINCIPAL ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('RELATÓRIO DIÁRIO DE OBRA - RDO', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Documento Técnico de Acompanhamento Diário de Engenharia Civil`,
    margin + 6,
    y + 15
  );

  // Badge RDO Number
  doc.setFillColor(245, 158, 11); // amber-500
  doc.roundedRect(pageWidth - margin - 42, y + 5, 36, 14, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(rdo.rdoNumber, pageWidth - margin - 24, y + 14, { align: 'center' });

  y += 28;

  // --- DADOS DA OBRA E EMPRESA ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 32, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  // Coluna 1
  doc.text('Obra:', margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(rdo.projectName, margin + 22, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Código:', margin + 4, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(project?.code || 'OBRA-2026', margin + 22, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Local:', margin + 4, y + 18);
  doc.setFont('helvetica', 'normal');
  const addressText = project?.address || 'Canteiro de Obras Principal';
  doc.text(doc.splitTextToSize(addressText, 70), margin + 22, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.text('Data do RDO:', margin + 4, y + 26);
  doc.setFont('helvetica', 'normal');
  doc.text(rdo.date, margin + 26, y + 26);

  // Coluna 2
  const col2X = margin + contentWidth / 2 + 2;
  doc.setFont('helvetica', 'bold');
  doc.text('Construtora:', col2X, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(company?.name || project?.companyName || 'Empresa Construtora', col2X + 24, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('CNPJ:', col2X, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(company?.cnpj || 'Não informado', col2X + 24, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Responsável:', col2X, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(rdo.authorName || project?.residentEngineer || 'Eng. Larissa Freitas', col2X + 24, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.text('CREA / CAU:', col2X, y + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(project?.crea || company?.crea || 'CREA-SP 506.123/D', col2X + 24, y + 24);

  y += 36;

  // --- CONDIÇÕES CLIMÁTICAS ---
  checkPageBreak(18);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('1. CONDIÇÕES CLIMÁTICAS NO CANTEIRO', margin + 3, y + 4.2);
  y += 8;

  const weatherWidth = contentWidth / 3;
  const weathers = [
    { label: 'Manhã', val: rdo.weatherMorning },
    { label: 'Tarde', val: rdo.weatherAfternoon },
    { label: 'Noite', val: rdo.weatherNight },
  ];

  weathers.forEach((w, i) => {
    const wx = margin + i * weatherWidth;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(wx, y, weatherWidth - 2, 9, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${w.label}:`, wx + 3, y + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(w.val || 'Normal', wx + 18, y + 5.5);
  });
  y += 13;

  // --- MÃO DE OBRA E EFETIVO ---
  checkPageBreak(24);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`2. MÃO DE OBRA E EFETIVO DIÁRIO (Total: ${rdo.totalWorkers} colaboradores)`, margin + 3, y + 4.2);
  y += 8;

  // Tabela Mão de Obra Header
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Função / Especialidade', margin + 3, y + 3.8);
  doc.text('Tipo de Vínculo', margin + contentWidth - 65, y + 3.8);
  doc.text('Quantidade', margin + contentWidth - 20, y + 3.8, { align: 'right' });
  y += 6;

  if (rdo.workforce && rdo.workforce.length > 0) {
    rdo.workforce.forEach((w, idx) => {
      checkPageBreak(6);
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
      doc.rect(margin, y, contentWidth, 5, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(w.role, margin + 3, y + 3.6);
      doc.text(w.type === 'própria' ? 'Equipe Própria' : 'Subempreiteira / Terceirizada', margin + contentWidth - 65, y + 3.6);
      doc.setFont('helvetica', 'bold');
      doc.text(`${w.count}`, margin + contentWidth - 20, y + 3.6, { align: 'right' });
      y += 5.2;
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Nenhum registro de mão de obra.', margin + 3, y + 4);
    y += 6;
  }
  y += 3;

  // --- ATIVIDADES EXECUTADAS ---
  checkPageBreak(24);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('3. ETAPAS E ATIVIDADES EXECUTADAS NO DIA', margin + 3, y + 4.2);
  y += 8;

  // Tabela Atividades Header
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Descrição da Atividade', margin + 3, y + 3.8);
  doc.text('Localização / Pavimento', margin + contentWidth - 85, y + 3.8);
  doc.text('% Concluído', margin + contentWidth - 36, y + 3.8);
  doc.text('Status', margin + contentWidth - 14, y + 3.8, { align: 'right' });
  y += 6;

  if (rdo.activities && rdo.activities.length > 0) {
    rdo.activities.forEach((act, idx) => {
      checkPageBreak(6.5);
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
      doc.rect(margin, y, contentWidth, 6, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(doc.splitTextToSize(act.description, 75)[0] || act.description, margin + 3, y + 4);
      doc.text(act.location || 'Canteiro', margin + contentWidth - 85, y + 4);
      doc.setFont('helvetica', 'bold');
      doc.text(`${act.progressPercent}%`, margin + contentWidth - 36, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(act.status, margin + contentWidth - 14, y + 4, { align: 'right' });
      y += 6.2;
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Nenhuma atividade registrada no período.', margin + 3, y + 4);
    y += 6;
  }
  y += 3;

  // --- MATERIAIS RECEBIDOS ---
  if (rdo.materials && rdo.materials.length > 0) {
    checkPageBreak(22);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('4. MATERIAIS E INSUMOS RECEBIDOS', margin + 3, y + 4.2);
    y += 8;

    doc.setFillColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Material / Insumo', margin + 3, y + 3.8);
    doc.text('Quantidade e Unidade', margin + contentWidth - 85, y + 3.8);
    doc.text('Fornecedor / Nota Fiscal', margin + contentWidth - 45, y + 3.8);
    y += 6;

    rdo.materials.forEach((mat, idx) => {
      checkPageBreak(5.5);
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
      doc.rect(margin, y, contentWidth, 5, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(mat.item, margin + 3, y + 3.6);
      doc.text(`${mat.quantity} ${mat.unit}`, margin + contentWidth - 85, y + 3.6);
      doc.text(mat.supplierOrInvoice || 'Entregue no canteiro', margin + contentWidth - 45, y + 3.6);
      y += 5.2;
    });
    y += 3;
  }

  // --- EQUIPAMENTOS ---
  if (rdo.equipment && rdo.equipment.length > 0) {
    checkPageBreak(20);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('5. MÁQUINAS E EQUIPAMENTOS NO CANTEIRO', margin + 3, y + 4.2);
    y += 8;

    doc.setFillColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Equipamento', margin + 3, y + 3.8);
    doc.text('Quantidade', margin + contentWidth - 65, y + 3.8);
    doc.text('Condição Operacional', margin + contentWidth - 30, y + 3.8);
    y += 6;

    rdo.equipment.forEach((eq, idx) => {
      checkPageBreak(5.5);
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
      doc.rect(margin, y, contentWidth, 5, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(eq.name, margin + 3, y + 3.6);
      doc.text(`${eq.quantity}`, margin + contentWidth - 65, y + 3.6);
      doc.text(eq.status === 'operando' ? 'Operando' : 'Parado / Manutenção', margin + contentWidth - 30, y + 3.6);
      y += 5.2;
    });
    y += 3;
  }

  // --- OCORRÊNCIAS E OBSERVAÇÕES ---
  checkPageBreak(28);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('6. OCORRÊNCIAS, PARALISAÇÕES E OBSERVAÇÕES TÉCNICAS', margin + 3, y + 4.2);
  y += 8;

  // Box Ocorrências
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9);
  doc.text('Ocorrências, Acidentes ou Paralisações:', margin + 2, y + 3);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const occLines = doc.splitTextToSize(rdo.occurrences || 'Sem ocorrências anormais registradas no turno.', contentWidth - 6);
  doc.text(occLines, margin + 2, y);
  y += occLines.length * 3.8 + 3;

  // Box Observações
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Observações e Recomendações Gerais:', margin + 2, y + 3);
  y += 5;
  doc.setFont('helvetica', 'normal');
  const noteLines = doc.splitTextToSize(rdo.generalNotes || 'Atividades transcorreram dentro do cronograma previsto.', contentWidth - 6);
  doc.text(noteLines, margin + 2, y);
  y += noteLines.length * 3.8 + 6;

  // --- ANEXOS E FOTOS ---
  if (rdo.photoAttachments && rdo.photoAttachments.length > 0) {
    checkPageBreak(30);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`7. REGISTRO FOTOGRÁFICO DO CANTEIRO (${rdo.photoAttachments.length} Fotos)`, margin + 3, y + 4.2);
    y += 9;

    rdo.photoAttachments.forEach((p, pIdx) => {
      checkPageBreak(12);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 9, 1, 1, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Foto ${pIdx + 1}: ${p.caption}`, margin + 3, y + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Horário: ${p.timestamp || '--:--'} | Etapa: ${p.stage || 'Geral'}`, margin + 3, y + 7.5);
      if (p.googleDriveUrl) {
        doc.setTextColor(37, 99, 235);
        doc.text('Arquivo salvo no Google Drive da Obra', margin + contentWidth - 65, y + 6);
      }
      y += 11;
    });
  }

  // --- ASSINATURAS FORMAIS ---
  checkPageBreak(35);
  y += 4;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);

  const signWidth = (contentWidth - 10) / 2;

  // Assinatura Engenheiro
  const sign1X = margin;
  doc.line(sign1X + 5, y + 16, sign1X + signWidth - 5, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(rdo.authorName || 'Engenheiro(a) Residente Responsável', sign1X + signWidth / 2, y + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(project?.crea || 'CREA / CAU Registrado', sign1X + signWidth / 2, y + 24, { align: 'center' });

  // Assinatura Fiscalização
  const sign2X = margin + signWidth + 10;
  doc.line(sign2X + 5, y + 16, sign2X + signWidth - 5, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Fiscal da Obra / Contratante', sign2X + signWidth / 2, y + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Assinatura e Carimbo', sign2X + signWidth / 2, y + 24, { align: 'center' });

  return doc;
}

/**
 * Generates and downloads the RDO PDF report directly in the browser
 */
export async function generateRdoPdf(
  rdo: Rdo,
  project?: Project,
  company?: Company
): Promise<void> {
  const doc = await buildRdoPdfDoc(rdo, project, company);
  const fileName = `${rdo.rdoNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}_${rdo.date}.pdf`;
  doc.save(fileName);
}

/**
 * Generates the RDO PDF report as a binary Blob ready for Google Drive upload / backup
 */
export async function generateRdoPdfBlob(
  rdo: Rdo,
  project?: Project,
  company?: Company
): Promise<{ blob: Blob; fileName: string }> {
  const doc = await buildRdoPdfDoc(rdo, project, company);
  const fileName = `${rdo.rdoNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}_${rdo.date}.pdf`;
  const blob = doc.output('blob');
  return { blob, fileName };
}
