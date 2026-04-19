import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Génère un rapport PDF à partir d'un élément HTML
 * @param {HTMLElement} element - L'élément à capturer
 * @param {string} filename - Nom du fichier
 */
export const generatePDF = async (element, filename = 'rapport-chantier.pdf') => {
  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Meilleure qualité
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    return false;
  }
};
