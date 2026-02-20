import { PrismaClient } from '@prisma/client';

interface TranslationSeed {
  key: string;
  es: string;
  en: string;
  category: string;
}

const translations: TranslationSeed[] = [
  // Sidebar Menu
  { key: 'menu.dashboard', es: 'Dashboard', en: 'Dashboard', category: 'menu' },
  { key: 'menu.budgets', es: 'Presupuestos', en: 'Budgets', category: 'menu' },
  { key: 'menu.savings', es: 'Ahorros', en: 'Savings', category: 'menu' },
  { key: 'menu.deferrals', es: 'Diferidos', en: 'Deferrals', category: 'menu' },
  { key: 'menu.expenses', es: 'Gastos', en: 'Expenses', category: 'menu' },
  { key: 'menu.planValues', es: 'Valores Plan', en: 'Plan Values', category: 'menu' },
  { key: 'menu.committedTransactions', es: 'Trans. Comprometidas', en: 'Committed Trans.', category: 'menu' },
  { key: 'menu.realTransactions', es: 'Trans. Reales', en: 'Real Trans.', category: 'menu' },
  { key: 'menu.reports', es: 'Reportes', en: 'Reports', category: 'menu' },
  { key: 'menu.configuration', es: 'Configuración', en: 'Configuration', category: 'menu' },
  { key: 'menu.masterData', es: 'Datos Maestros', en: 'Master Data', category: 'menu' },
  { key: 'menu.users', es: 'Usuarios', en: 'Users', category: 'menu' },
  { key: 'menu.roles', es: 'Roles', en: 'Roles', category: 'menu' },
  { key: 'menu.translations', es: 'Traducciones', en: 'Translations', category: 'menu' },
  { key: 'menu.detailedReports', es: 'Reportes Detallados', en: 'Detailed Reports', category: 'menu' },
  { key: 'menu.compareBudgets', es: 'Comparar Presupuestos', en: 'Compare Budgets', category: 'menu' },
  { key: 'menu.approvals', es: 'Aprobaciones', en: 'Approvals', category: 'menu' },
  { key: 'menu.audit', es: 'Auditoría', en: 'Audit Log', category: 'menu' },
  { key: 'menu.exchangeRates', es: 'Tasas de Cambio', en: 'Exchange Rates', category: 'menu' },

  // Section headers
  { key: 'section.administration', es: 'Administración', en: 'Administration', category: 'section' },
  { key: 'section.budgetManagement', es: 'Gestión de Presupuesto', en: 'Budget Management', category: 'section' },

  // Common buttons
  { key: 'btn.save', es: 'Guardar', en: 'Save', category: 'button' },
  { key: 'btn.cancel', es: 'Cancelar', en: 'Cancel', category: 'button' },
  { key: 'btn.edit', es: 'Editar', en: 'Edit', category: 'button' },
  { key: 'btn.delete', es: 'Eliminar', en: 'Delete', category: 'button' },
  { key: 'btn.create', es: 'Crear', en: 'Create', category: 'button' },
  { key: 'btn.search', es: 'Buscar', en: 'Search', category: 'button' },
  { key: 'btn.filter', es: 'Filtrar', en: 'Filter', category: 'button' },
  { key: 'btn.download', es: 'Descargar', en: 'Download', category: 'button' },
  { key: 'btn.close', es: 'Cerrar', en: 'Close', category: 'button' },
  { key: 'btn.apply', es: 'Aplicar', en: 'Apply', category: 'button' },
  { key: 'btn.confirm', es: 'Confirmar', en: 'Confirm', category: 'button' },
  { key: 'btn.new', es: 'Nuevo', en: 'New', category: 'button' },
  { key: 'btn.export', es: 'Exportar', en: 'Export', category: 'button' },
  { key: 'btn.downloadExcel', es: 'Descargar Excel', en: 'Download Excel', category: 'button' },
  { key: 'btn.compare', es: 'Comparar', en: 'Compare', category: 'button' },
  { key: 'btn.generateDescription', es: 'Generar Descripción', en: 'Generate Description', category: 'button' },
  { key: 'btn.logout', es: 'Cerrar Sesión', en: 'Logout', category: 'button' },
  { key: 'btn.login', es: 'Iniciar Sesión', en: 'Login', category: 'button' },
  { key: 'btn.approve', es: 'Aprobar', en: 'Approve', category: 'button' },
  { key: 'btn.reject', es: 'Rechazar', en: 'Reject', category: 'button' },
  { key: 'btn.back', es: 'Volver', en: 'Back', category: 'button' },
  { key: 'btn.next', es: 'Siguiente', en: 'Next', category: 'button' },
  { key: 'btn.previous', es: 'Anterior', en: 'Previous', category: 'button' },

  // Common labels
  { key: 'label.name', es: 'Nombre', en: 'Name', category: 'label' },
  { key: 'label.description', es: 'Descripción', en: 'Description', category: 'label' },
  { key: 'label.code', es: 'Código', en: 'Code', category: 'label' },
  { key: 'label.status', es: 'Estado', en: 'Status', category: 'label' },
  { key: 'label.date', es: 'Fecha', en: 'Date', category: 'label' },
  { key: 'label.month', es: 'Mes', en: 'Month', category: 'label' },
  { key: 'label.year', es: 'Año', en: 'Year', category: 'label' },
  { key: 'label.version', es: 'Versión', en: 'Version', category: 'label' },
  { key: 'label.total', es: 'Total', en: 'Total', category: 'label' },
  { key: 'label.amount', es: 'Monto', en: 'Amount', category: 'label' },
  { key: 'label.currency', es: 'Moneda', en: 'Currency', category: 'label' },
  { key: 'label.type', es: 'Tipo', en: 'Type', category: 'label' },
  { key: 'label.active', es: 'Activo', en: 'Active', category: 'label' },
  { key: 'label.inactive', es: 'Inactivo', en: 'Inactive', category: 'label' },
  { key: 'label.budget', es: 'Presupuesto', en: 'Budget', category: 'label' },
  { key: 'label.expense', es: 'Gasto', en: 'Expense', category: 'label' },
  { key: 'label.category', es: 'Categoría', en: 'Category', category: 'label' },
  { key: 'label.key', es: 'Clave', en: 'Key', category: 'label' },
  { key: 'label.value', es: 'Valor', en: 'Value', category: 'label' },
  { key: 'label.spanish', es: 'Español', en: 'Spanish', category: 'label' },
  { key: 'label.english', es: 'Inglés', en: 'English', category: 'label' },
  { key: 'label.language', es: 'Idioma', en: 'Language', category: 'label' },
  { key: 'label.actions', es: 'Acciones', en: 'Actions', category: 'label' },
  { key: 'label.all', es: 'Todos', en: 'All', category: 'label' },
  { key: 'label.pending', es: 'Pendiente', en: 'Pending', category: 'label' },
  { key: 'label.approved', es: 'Aprobado', en: 'Approved', category: 'label' },
  { key: 'label.difference', es: 'Diferencia', en: 'Difference', category: 'label' },
  { key: 'label.percentage', es: 'Porcentaje', en: 'Percentage', category: 'label' },
  { key: 'label.company', es: 'Empresa', en: 'Company', category: 'label' },
  { key: 'label.area', es: 'Área', en: 'Area', category: 'label' },
  { key: 'label.direction', es: 'Dirección', en: 'Direction', category: 'label' },
  { key: 'label.user', es: 'Usuario', en: 'User', category: 'label' },
  { key: 'label.password', es: 'Contraseña', en: 'Password', category: 'label' },
  { key: 'label.email', es: 'Correo', en: 'Email', category: 'label' },
  { key: 'label.fullName', es: 'Nombre Completo', en: 'Full Name', category: 'label' },
  { key: 'label.role', es: 'Rol', en: 'Role', category: 'label' },
  { key: 'label.permission', es: 'Permiso', en: 'Permission', category: 'label' },
  { key: 'label.view', es: 'Ver', en: 'View', category: 'label' },
  { key: 'label.modify', es: 'Modificar', en: 'Modify', category: 'label' },

  // Months
  { key: 'month.1', es: 'Enero', en: 'January', category: 'month' },
  { key: 'month.2', es: 'Febrero', en: 'February', category: 'month' },
  { key: 'month.3', es: 'Marzo', en: 'March', category: 'month' },
  { key: 'month.4', es: 'Abril', en: 'April', category: 'month' },
  { key: 'month.5', es: 'Mayo', en: 'May', category: 'month' },
  { key: 'month.6', es: 'Junio', en: 'June', category: 'month' },
  { key: 'month.7', es: 'Julio', en: 'July', category: 'month' },
  { key: 'month.8', es: 'Agosto', en: 'August', category: 'month' },
  { key: 'month.9', es: 'Septiembre', en: 'September', category: 'month' },
  { key: 'month.10', es: 'Octubre', en: 'October', category: 'month' },
  { key: 'month.11', es: 'Noviembre', en: 'November', category: 'month' },
  { key: 'month.12', es: 'Diciembre', en: 'December', category: 'month' },
  { key: 'month.short.1', es: 'Ene', en: 'Jan', category: 'month' },
  { key: 'month.short.2', es: 'Feb', en: 'Feb', category: 'month' },
  { key: 'month.short.3', es: 'Mar', en: 'Mar', category: 'month' },
  { key: 'month.short.4', es: 'Abr', en: 'Apr', category: 'month' },
  { key: 'month.short.5', es: 'May', en: 'May', category: 'month' },
  { key: 'month.short.6', es: 'Jun', en: 'Jun', category: 'month' },
  { key: 'month.short.7', es: 'Jul', en: 'Jul', category: 'month' },
  { key: 'month.short.8', es: 'Ago', en: 'Aug', category: 'month' },
  { key: 'month.short.9', es: 'Sep', en: 'Sep', category: 'month' },
  { key: 'month.short.10', es: 'Oct', en: 'Oct', category: 'month' },
  { key: 'month.short.11', es: 'Nov', en: 'Nov', category: 'month' },
  { key: 'month.short.12', es: 'Dic', en: 'Dec', category: 'month' },

  // Messages
  { key: 'msg.loading', es: 'Cargando...', en: 'Loading...', category: 'message' },
  { key: 'msg.noResults', es: 'Sin resultados', en: 'No results', category: 'message' },
  { key: 'msg.error', es: 'Error', en: 'Error', category: 'message' },
  { key: 'msg.success', es: 'Éxito', en: 'Success', category: 'message' },
  { key: 'msg.confirmDelete', es: '¿Está seguro de que desea eliminar este elemento?', en: 'Are you sure you want to delete this item?', category: 'message' },
  { key: 'msg.savedSuccessfully', es: 'Guardado exitosamente', en: 'Saved successfully', category: 'message' },
  { key: 'msg.deletedSuccessfully', es: 'Eliminado exitosamente', en: 'Deleted successfully', category: 'message' },
  { key: 'msg.errorSaving', es: 'Error al guardar', en: 'Error saving', category: 'message' },
  { key: 'msg.errorLoading', es: 'Error al cargar datos', en: 'Error loading data', category: 'message' },
  { key: 'msg.requiredField', es: 'Campo requerido', en: 'Required field', category: 'message' },
  { key: 'msg.invalidCredentials', es: 'Credenciales inválidas', en: 'Invalid credentials', category: 'message' },
  { key: 'msg.sessionExpired', es: 'Sesión expirada', en: 'Session expired', category: 'message' },
  { key: 'msg.duplicateKey', es: 'La clave ya existe', en: 'Key already exists', category: 'message' },
  { key: 'msg.sameYearRequired', es: 'Los presupuestos deben ser del mismo año', en: 'Budgets must be from the same year', category: 'message' },
  { key: 'msg.selectTwoBudgets', es: 'Seleccione dos presupuestos para comparar', en: 'Select two budgets to compare', category: 'message' },

  // Budget specific
  { key: 'budget.active', es: 'Presupuesto Vigente', en: 'Active Budget', category: 'budget' },
  { key: 'budget.compare', es: 'Comparar Presupuestos', en: 'Compare Budgets', category: 'budget' },
  { key: 'budget.newVersion', es: 'Nueva Versión', en: 'New Version', category: 'budget' },
  { key: 'budget.planValues', es: 'Valores Plan', en: 'Plan Values', category: 'budget' },
  { key: 'budget.committed', es: 'Comprometido', en: 'Committed', category: 'budget' },
  { key: 'budget.real', es: 'Real', en: 'Real', category: 'budget' },
  { key: 'budget.planned', es: 'Planificado', en: 'Planned', category: 'budget' },
  { key: 'budget.executed', es: 'Ejecutado', en: 'Executed', category: 'budget' },
  { key: 'budget.variance', es: 'Variación', en: 'Variance', category: 'budget' },
  { key: 'budget.newExpenses', es: 'Gastos Nuevos', en: 'New Expenses', category: 'budget' },
  { key: 'budget.removedExpenses', es: 'Gastos Eliminados', en: 'Removed Expenses', category: 'budget' },
  { key: 'budget.modifiedExpenses', es: 'Gastos Modificados', en: 'Modified Expenses', category: 'budget' },
  { key: 'budget.unchanged', es: 'Sin Cambios', en: 'Unchanged', category: 'budget' },
  { key: 'budget.totalBudgetA', es: 'Total Presupuesto A', en: 'Total Budget A', category: 'budget' },
  { key: 'budget.totalBudgetB', es: 'Total Presupuesto B', en: 'Total Budget B', category: 'budget' },
  { key: 'budget.differenceDetail', es: 'Descripción de Diferencias', en: 'Difference Description', category: 'budget' },

  // Reports
  { key: 'report.executiveSummary', es: 'Resumen Ejecutivo de Presupuesto', en: 'Budget Executive Summary', category: 'report' },
  { key: 'report.budgetExecution', es: 'Ejecución Presupuestaria por Gasto', en: 'Budget Execution by Expense', category: 'report' },
  { key: 'report.planVsReal', es: 'Comparativo Plan vs Real por Mes', en: 'Plan vs Real by Month', category: 'report' },
  { key: 'report.byFinancialCompany', es: 'Gastos por Empresa Financiera', en: 'Expenses by Financial Company', category: 'report' },
  { key: 'report.byTechDirection', es: 'Gastos por Dirección Tecnológica', en: 'Expenses by Tech Direction', category: 'report' },
  { key: 'report.byUserArea', es: 'Gastos por Área Usuaria', en: 'Expenses by User Area', category: 'report' },
  { key: 'report.detailedTransactions', es: 'Transacciones Detalladas por Período', en: 'Detailed Transactions by Period', category: 'report' },
  { key: 'report.varianceAnalysis', es: 'Análisis de Variaciones', en: 'Variance Analysis', category: 'report' },
  { key: 'report.savingsDeferrals', es: 'Reporte de Ahorros y Diferidos', en: 'Savings & Deferrals Report', category: 'report' },
  { key: 'report.annualProjection', es: 'Proyección de Cierre Anual', en: 'Annual Closing Projection', category: 'report' },

  // Configuration
  { key: 'config.language', es: 'Idioma', en: 'Language', category: 'config' },
  { key: 'config.theme', es: 'Tema', en: 'Theme', category: 'config' },
  { key: 'config.colorPalette', es: 'Paleta de Colores / Tema', en: 'Color Palette / Theme', category: 'config' },
  { key: 'config.systemInfo', es: 'Información del Sistema', en: 'System Information', category: 'config' },
  { key: 'config.selectLanguage', es: 'Selecciona el idioma de la interfaz', en: 'Select the interface language', category: 'config' },
  { key: 'config.selectTheme', es: 'Selecciona un tema para personalizar la apariencia de la aplicación', en: 'Select a theme to customize the application appearance', category: 'config' },
  { key: 'config.application', es: 'Aplicación', en: 'Application', category: 'config' },
  { key: 'config.backend', es: 'Backend', en: 'Backend', category: 'config' },
  { key: 'config.frontend', es: 'Frontend', en: 'Frontend', category: 'config' },
  { key: 'config.database', es: 'Base de Datos', en: 'Database', category: 'config' },
  { key: 'config.hosting', es: 'Hosting', en: 'Hosting', category: 'config' },
  { key: 'config.preview', es: 'Vista Previa', en: 'Preview', category: 'config' },

  // Page titles
  { key: 'page.dashboard', es: 'Dashboard', en: 'Dashboard', category: 'page' },
  { key: 'page.budgets', es: 'Presupuestos', en: 'Budgets', category: 'page' },
  { key: 'page.expenses', es: 'Gastos', en: 'Expenses', category: 'page' },
  { key: 'page.savings', es: 'Ahorros', en: 'Savings', category: 'page' },
  { key: 'page.deferrals', es: 'Diferidos', en: 'Deferrals', category: 'page' },
  { key: 'page.configuration', es: 'Configuración', en: 'Configuration', category: 'page' },
  { key: 'page.translations', es: 'Gestión de Traducciones', en: 'Translation Management', category: 'page' },
  { key: 'page.detailedReports', es: 'Reportes Detallados', en: 'Detailed Reports', category: 'page' },
  { key: 'page.compareBudgets', es: 'Comparar Presupuestos', en: 'Compare Budgets', category: 'page' },
  { key: 'page.masterData', es: 'Datos Maestros', en: 'Master Data', category: 'page' },
  { key: 'page.users', es: 'Gestión de Usuarios', en: 'User Management', category: 'page' },
  { key: 'page.roles', es: 'Gestión de Roles', en: 'Role Management', category: 'page' },
  { key: 'page.approvals', es: 'Aprobaciones Pendientes', en: 'Pending Approvals', category: 'page' },
  { key: 'page.audit', es: 'Auditoría', en: 'Audit Log', category: 'page' },

  // Theme names
  { key: 'theme.default', es: 'Azul Corporativo', en: 'Corporate Blue', category: 'theme' },
  { key: 'theme.green', es: 'Verde Naturaleza', en: 'Nature Green', category: 'theme' },
  { key: 'theme.purple', es: 'Púrpura Elegante', en: 'Elegant Purple', category: 'theme' },
  { key: 'theme.red', es: 'Rojo Ejecutivo', en: 'Executive Red', category: 'theme' },
  { key: 'theme.teal', es: 'Teal Moderno', en: 'Modern Teal', category: 'theme' },
  { key: 'theme.orange', es: 'Naranja Energético', en: 'Energetic Orange', category: 'theme' },

  // App name
  { key: 'app.name', es: 'Tech Budget', en: 'Tech Budget', category: 'app' },
  { key: 'app.subtitle', es: 'Gestión de Presupuesto', en: 'Budget Management', category: 'app' },

  // Table headers - Transactions
  { key: 'table.budgetLine', es: 'Línea Presupuesto', en: 'Budget Line', category: 'table' },
  { key: 'table.serviceDate', es: 'Fecha Servicio', en: 'Service Date', category: 'table' },
  { key: 'table.postingDate', es: 'Fecha Imputación', en: 'Posting Date', category: 'table' },
  { key: 'table.refDocument', es: 'Ref. Documento', en: 'Ref. Document', category: 'table' },
  { key: 'table.currency', es: 'Moneda', en: 'Currency', category: 'table' },
  { key: 'table.value', es: 'Valor', en: 'Value', category: 'table' },
  { key: 'table.month', es: 'Mes', en: 'Month', category: 'table' },
  { key: 'table.compensated', es: 'Compensada', en: 'Compensated', category: 'table' },
  { key: 'table.actions', es: 'Acciones', en: 'Actions', category: 'table' },
  { key: 'table.code', es: 'Código', en: 'Code', category: 'table' },
  { key: 'table.description', es: 'Descripción', en: 'Description', category: 'table' },
  { key: 'table.company', es: 'Empresa', en: 'Company', category: 'table' },
  { key: 'table.area', es: 'Área', en: 'Area', category: 'table' },
  { key: 'table.category', es: 'Categoría', en: 'Category', category: 'table' },
  { key: 'table.total', es: 'Total', en: 'Total', category: 'table' },
  { key: 'table.tags', es: 'Tags', en: 'Tags', category: 'table' },
  { key: 'table.status', es: 'Estado', en: 'Status', category: 'table' },
  { key: 'table.expense', es: 'Gasto', en: 'Expense', category: 'table' },
  { key: 'table.budget', es: 'Presupuesto', en: 'Budget', category: 'table' },
  { key: 'table.requestedBy', es: 'Solicitado por', en: 'Requested by', category: 'table' },
  { key: 'table.comment', es: 'Comentario', en: 'Comment', category: 'table' },
  { key: 'table.date', es: 'Fecha', en: 'Date', category: 'table' },
  { key: 'table.approvedBy', es: 'Aprobado por', en: 'Approved by', category: 'table' },
  { key: 'table.lastModified', es: 'Última Modif.', en: 'Last Modified', category: 'table' },
  { key: 'table.modifiedBy', es: 'Modificado por', en: 'Modified by', category: 'table' },
  { key: 'table.externalLink', es: 'Link Externo', en: 'External Link', category: 'table' },

  // Transaction page
  { key: 'transaction.new', es: 'Nueva Transacción', en: 'New Transaction', category: 'transaction' },
  { key: 'transaction.committed', es: 'Transacción Comprometida', en: 'Committed Transaction', category: 'transaction' },
  { key: 'transaction.real', es: 'Transacción Real', en: 'Real Transaction', category: 'transaction' },
  { key: 'transaction.fromCommitted', es: 'Desde Comprometida', en: 'From Committed', category: 'transaction' },
  { key: 'transaction.hideCommitted', es: 'Ocultar Comprometidas', en: 'Hide Committed', category: 'transaction' },

  // Expense page
  { key: 'expense.new', es: 'Nuevo Gasto', en: 'New Expense', category: 'expense' },
  { key: 'expense.search', es: 'Buscar por código, descripción o tags...', en: 'Search by code, description or tags...', category: 'expense' },
  { key: 'expense.showInactive', es: 'Ver desactivados', en: 'Show inactive', category: 'expense' },
  { key: 'expense.deactivate', es: 'Desactivar', en: 'Deactivate', category: 'expense' },
  { key: 'expense.reactivate', es: 'Reactivar', en: 'Reactivate', category: 'expense' },
  { key: 'expense.noTags', es: 'Sin tags', en: 'No tags', category: 'expense' },

  // Approvals
  { key: 'approval.pending', es: 'Aprobaciones Pendientes', en: 'Pending Approvals', category: 'approval' },
  { key: 'approval.approveSelected', es: 'Aprobar seleccionadas', en: 'Approve selected', category: 'approval' },
  { key: 'approval.noPending', es: 'No hay solicitudes pendientes de aprobación', en: 'No pending approval requests', category: 'approval' },
  { key: 'approval.detail', es: 'Detalle de Solicitud', en: 'Request Detail', category: 'approval' },
  { key: 'approval.current', es: 'Actual', en: 'Current', category: 'approval' },
  { key: 'approval.proposed', es: 'Propuesto', en: 'Proposed', category: 'approval' },

  // Savings
  { key: 'saving.new', es: 'Nuevo Ahorro', en: 'New Saving', category: 'saving' },
  { key: 'saving.readOnly', es: 'Solo lectura - Solo se pueden modificar ahorros del presupuesto vigente', en: 'Read only - Savings can only be modified on the active budget', category: 'saving' },

  // Budget page
  { key: 'budget.addLine', es: 'Agregar Línea', en: 'Add Line', category: 'budget' },
  { key: 'budget.requestChange', es: 'Solicitar Cambio de Presupuesto', en: 'Request Budget Change', category: 'budget' },
  { key: 'budget.submitReview', es: 'Enviar a Revisión', en: 'Submit for Review', category: 'budget' },
  { key: 'budget.setActive', es: 'Marcar Vigente', en: 'Set Active', category: 'budget' },
  { key: 'budget.newBudget', es: 'Nuevo Presupuesto', en: 'New Budget', category: 'budget' },
  { key: 'budget.myRequests', es: 'Mis Solicitudes', en: 'My Requests', category: 'budget' },
  { key: 'budget.readOnly', es: 'Solo lectura', en: 'Read only', category: 'budget' },

  // Filter panel
  { key: 'filter.search', es: 'Buscar gasto...', en: 'Search expense...', category: 'filter' },
  { key: 'filter.clearFilters', es: 'Limpiar filtros', en: 'Clear filters', category: 'filter' },
  { key: 'filter.all', es: 'Todas', en: 'All', category: 'filter' },

  // Page titles for exchange rates
  { key: 'page.exchangeRates', es: 'Tasas de Cambio', en: 'Exchange Rates', category: 'page' },

  // Master data page
  { key: 'masterData.expenseCategories', es: 'Categorías de Gasto', en: 'Expense Categories', category: 'masterData' },
];

export async function seedTranslations(prisma: PrismaClient) {
  console.log('🌐 Seeding translations...');
  
  // Clear existing translations
  await prisma.translation.deleteMany();
  await prisma.systemConfig.deleteMany();

  // Seed translations
  for (const t of translations) {
    await prisma.translation.create({ data: t });
  }

  // Seed system config with default locale
  await prisma.systemConfig.create({
    data: { key: 'locale', value: 'es' }
  });
  await prisma.systemConfig.create({
    data: { key: 'theme', value: 'default' }
  });

  console.log(`✅ Seeded ${translations.length} translations and system config`);
}
