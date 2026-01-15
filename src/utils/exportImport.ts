import { jsPDF } from 'jspdf';
import { useStore } from '../store';

type AppState = ReturnType<typeof useStore.getState>;

export const exportData = (format: 'json' | 'markdown' | 'pdf', state: AppState) => {
  const { notes, folders, connections, settings, patches, featureFlags, auditLog } = state;

  if (format === 'json') {
    const data = { notes, folders, connections, settings, patches, featureFlags, auditLog };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cogniflow-export-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } else if (format === 'markdown') {
    let content = '# Cogniflow Export\n\n';
    notes.forEach(note => {
      content += `## ${note.title}\n\n`;
      content += `*Tags: ${note.tags.join(', ')}*\n`;
      content += `*Created: ${new Date(note.createdAt).toLocaleString()}*\n\n`;
      content += `${note.content}\n\n`;
      content += `---\n\n`;
    });
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cogniflow-export-${new Date().toISOString()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    const doc = new jsPDF();
    let yOffset = 10;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    const maxWidth = 190;

    doc.setFontSize(18);
    doc.text("Cogniflow Notes Export", margin, yOffset);
    yOffset += 15;

    notes.forEach((note) => {
      if (yOffset > pageHeight - 30) {
        doc.addPage();
        yOffset = 10;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(note.title, margin, yOffset);
      yOffset += 7;

      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100);
      doc.text(`Created: ${new Date(note.createdAt).toLocaleString()} | Tags: ${note.tags.join(', ')}`, margin, yOffset);
      doc.setTextColor(0);
      yOffset += 7;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const splitContent = doc.splitTextToSize(note.content, maxWidth);

      if (yOffset + (splitContent.length * 5) > pageHeight - 10) {
        doc.addPage();
        yOffset = 10;
      }

      doc.text(splitContent, margin, yOffset);
      yOffset += (splitContent.length * 5) + 10;

      doc.setDrawColor(200);
      doc.line(margin, yOffset - 5, margin + maxWidth, yOffset - 5);
    });

    doc.save(`cogniflow-export-${new Date().toISOString()}.pdf`);
  }
};

export const importData = (state: AppState) => {
  const { setNotes, setFolders, setConnections, setSettings, setPatches, setFeatureFlags, setAuditLog } = state;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') throw new Error('File could not be read.');
        const data = JSON.parse(result);
        if (!data.notes || !data.folders || !data.settings) throw new Error('Invalid Cogniflow export file format.');
        if (window.confirm('This will replace all your current data. Are you sure?')) {
          setNotes(data.notes || []);
          setFolders(data.folders || []);
          setConnections(data.connections || []);
          setSettings(data.settings || useStore.getState().settings);
          setPatches(data.patches || []);
          setFeatureFlags(data.featureFlags || []);
          setAuditLog(data.auditLog || []);
          alert('Data imported successfully!');
        }
      } catch (error) {
        alert(`Error importing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  };
  input.click();
};
