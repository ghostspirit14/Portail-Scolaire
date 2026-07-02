import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generateStudentPDF(studentName: string, includeCSP: boolean): Promise<void> {
  // Store the original window.getComputedStyle to restore it later
  const originalGetComputedStyle = window.getComputedStyle;

  // Set up offscreen canvas for oklch -> rgba conversion
  const helperCanvas = document.createElement('canvas');
  helperCanvas.width = 1;
  helperCanvas.height = 1;
  const ctx = helperCanvas.getContext('2d');

  function convertOklchToRgba(value: string): string {
    if (!value || typeof value !== 'string' || !value.includes('oklch')) {
      return value;
    }
    // Match oklch(...) patterns
    return value.replace(/oklch\([^)]+\)/g, (match) => {
      if (!ctx) return 'rgba(0,0,0,0)';
      try {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = match;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
      } catch (e) {
        return 'rgba(0,0,0,0)';
      }
    });
  }

  // Override getComputedStyle with a Proxy during execution
  window.getComputedStyle = function (elt, pseudoElt) {
    if (!elt) {
      return originalGetComputedStyle(elt, pseudoElt);
    }
    const style = originalGetComputedStyle(elt, pseudoElt);
    return new Proxy(style, {
      get(target, prop, receiver) {
        if (prop === 'getPropertyValue') {
          return function (propertyName: string) {
            const val = target.getPropertyValue(propertyName);
            if (typeof val === 'string') {
              return convertOklchToRgba(val);
            }
            return val;
          };
        }
        const val = target[prop as any];
        if (typeof val === 'string') {
          return convertOklchToRgba(val);
        }
        if (typeof val === 'function') {
          return (val as any).bind(target);
        }
        return val;
      }
    });
  };

  try {
    const pageIds = ['print-page-1', 'print-page-2'];
    if (includeCSP) {
      pageIds.push('print-page-3');
    }
    pageIds.push('print-page-4');
    pageIds.push('print-page-5');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210;
    const pdfHeight = 297;

    for (let i = 0; i < pageIds.length; i++) {
      const id = pageIds[i];
      const element = document.getElementById(id);
      
      if (!element) {
        console.error(`Page element with id ${id} not found.`);
        continue;
      }

      // Capture the page with html2canvas
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution for beautiful crisp prints
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    // Sanitize filename
    const sanitizedName = studentName ? studentName.trim().replace(/[^a-zA-Z0-9]/g, '_') : 'Nouvelle_Fiche';
    pdf.save(`Fiche_Scolaire_${sanitizedName}.pdf`);
  } finally {
    // Restore original window.getComputedStyle safely
    window.getComputedStyle = originalGetComputedStyle;
  }
}
