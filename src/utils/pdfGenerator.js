import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Génère un rapport PDF à partir d'un élément HTML
 * @param {HTMLElement} element - L'élément à capturer
 * @param {string} filename - Nom du fichier
 */
export const generatePDF = async (element, filename = 'rapport-chantier.pdf') => {
  try {
    console.log('Début de la génération du PDF...');
    
    // Petit délai pour s'assurer que le DOM est prêt et rendu
    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: true,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });
    
    console.log('Canvas généré avec succès');
    
    const imgData = canvas.toDataURL('image/png');
    if (imgData === 'data:,') {
      throw new Error('Canvas vide généré');
    }

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    
    console.log('Sauvegarde du fichier...');
    const pdfBlob = pdf.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    return false;
  }
};
