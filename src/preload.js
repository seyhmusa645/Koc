
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Auth
  getRequestCode: () => ipcRenderer.invoke('license:get-request-code'),
  login: (credentials) => ipcRenderer.invoke('user:login', credentials),
  register: (userInfo) => ipcRenderer.invoke('user:register', userInfo),
  importLicense: (licenseKey) => ipcRenderer.invoke('license:import', licenseKey),
  getLicenseStatus: () => ipcRenderer.invoke('license:status'),
  onLicenseInfo: (callback) => ipcRenderer.on('license-info', (_event, value) => callback(value)),
  onUserSession: (callback) => ipcRenderer.on('user-session', (_event, value) => callback(value)),

  // Data
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  loadData: () => ipcRenderer.invoke('load-data'),
  onDataImported: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('data-imported', listener);
    return () => ipcRenderer.removeListener('data-imported', listener);
  },
  
  // Kazanımlar
  loadOutcomes: () => ipcRenderer.send('outcomes-load'),
  onOutcomesLoaded: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('outcomes-loaded', listener);
    return () => ipcRenderer.removeListener('outcomes-loaded', listener);
  },
  onOutcomesUpdated: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('outcomes-updated', listener);
    return () => ipcRenderer.removeListener('outcomes-updated', listener);
  },
  onKazanimlarUpdated: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('kazanimlar-updated', listener);
    return () => ipcRenderer.removeListener('kazanimlar-updated', listener);
  },
  loadKazanimlar: () => ipcRenderer.invoke('load-kazanimlar'),
  saveKazanimlar: (kazanimlarData) => ipcRenderer.invoke('kazanimlar:save', kazanimlarData),
  loadHaftalikPlan: () => ipcRenderer.invoke('load-haftalik-plan'),
  
  // Students
  loadStudents: () => ipcRenderer.invoke('students-load'),
  saveStudent: (studentData) => ipcRenderer.invoke('student-save', studentData),
  deleteStudent: (studentId) => ipcRenderer.invoke('student-delete', studentId),
  updateStudent: (studentId, updateData) => ipcRenderer.invoke('student-update', studentId, updateData),
  importStudents: (students) => ipcRenderer.invoke('students-import', students),
  
  getAiEvaluation: (studentData, force = false) => ipcRenderer.invoke('student:get-ai-evaluation', studentData, force),
  checkEvaluationTiming: (studentId) => ipcRenderer.invoke('student:check-evaluation-timing', studentId),

  generatePlan: (planRequest) => ipcRenderer.invoke('plan:generate', planRequest),

  // PDF Export
  exportToPDF: () => ipcRenderer.invoke('export-to-pdf'),

  // Etüt Grupları (Study Sessions)
  etut: {
    load: () => ipcRenderer.invoke('etut:load'),
    save: (group) => ipcRenderer.invoke('etut:save', group),
    update: (id, updates) => ipcRenderer.invoke('etut:update', id, updates),
    delete: (id) => ipcRenderer.invoke('etut:delete', id),
    getStudentReport: (studentId) => ipcRenderer.invoke('etut:get-student-report', studentId)
  },

  // Performans Panosu
  loadPerformanceData: (sinif) => ipcRenderer.invoke('performance:load', sinif),
  savePerformanceData: (data) => ipcRenderer.invoke('performance:save', data),
  exportToExcel: (data) => ipcRenderer.invoke('performance:export-excel', data)
});


