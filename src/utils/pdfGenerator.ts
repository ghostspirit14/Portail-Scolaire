import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generateStudentPDF(studentName: string, includeCSP: boolean): Promise<void> {
  const originalGetComputedStyle = window.getComputedStyle;

  const helperCanvas = document.createElement('canvas');
  helperCanvas.width = 1;
  helperCanvas.height = 1;
  const ctx = helperCanvas.getContext('2d');

  function convertOklchToRgba(value: string): string {
    if (!value || typeof value !== 'string' || !value.includes('oklch')) {
      return value;
    }
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
        const val = Reflect.get(target, prop, receiver);
        if (typeof val === 'string') {
          return convertOklchToRgba(val);
        }
        if (typeof val === 'function') {
          return val.bind(target);
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

      const originalStyle = element.getAttribute('style');

      // Make element temporarily visible for capture
      element.style.position = 'static';
      element.style.visibility = 'visible';
      element.style.display = 'block';
      element.style.left = 'auto';
      element.style.top = 'auto';
      element.style.width = '794px';
      element.style.height = '1123px';

      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
          windowHeight: 1123,
          windowWidth: 794
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      } finally {
        // Restore original style
        if (originalStyle) {
          element.setAttribute('style', originalStyle);
        } else {
          element.removeAttribute('style');
        }
      }
    }

    const sanitizedName = studentName ? studentName.trim().replace(/[^a-zA-Z0-9]/g, '_') : 'Nouvelle_Fiche';
    pdf.save(`Fiche_Scolaire_${sanitizedName}.pdf`);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    alert('Erreur lors de la génération du PDF: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
  } finally {
    window.getComputedStyle = originalGetComputedStyle;
  }
}
