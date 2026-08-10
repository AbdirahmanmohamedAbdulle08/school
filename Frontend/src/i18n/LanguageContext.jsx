import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ar = {
  dashboard: '\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645', academicManagement: '\u0627\u0644\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0623\u0643\u0627\u062f\u064a\u0645\u064a\u0629', classes: '\u0627\u0644\u0641\u0635\u0648\u0644', teachers: '\u0627\u0644\u0645\u0639\u0644\u0645\u0648\u0646', students: '\u0627\u0644\u0637\u0644\u0627\u0628', classPromotion: '\u062a\u0631\u0642\u064a\u0629 \u0627\u0644\u0641\u0635\u0644', attendance: '\u0627\u0644\u062d\u0636\u0648\u0631', studentAttendance: '\u062d\u0636\u0648\u0631 \u0627\u0644\u0637\u0644\u0627\u0628', teacherAttendance: '\u062d\u0636\u0648\u0631 \u0627\u0644\u0645\u0639\u0644\u0645\u064a\u0646', examinations: '\u0627\u0644\u0627\u0645\u062a\u062d\u0627\u0646\u0627\u062a', exams: '\u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631\u0627\u062a', markEntry: '\u0625\u062f\u062e\u0627\u0644 \u0627\u0644\u062f\u0631\u062c\u0627\u062a', results: '\u0627\u0644\u0646\u062a\u0627\u0626\u062c', finance: '\u0627\u0644\u0645\u0627\u0644\u064a\u0629', cashbook: '\u062f\u0641\u062a\u0631 \u0627\u0644\u0646\u0642\u062f\u064a\u0629', payers: '\u0627\u0644\u062f\u0627\u0641\u0639\u0648\u0646', wallets: '\u0627\u0644\u0645\u062d\u0627\u0641\u0638', instituteStructure: '\u0647\u064a\u0643\u0644 \u0627\u0644\u0645\u0639\u0647\u062f', branches: '\u0627\u0644\u0641\u0631\u0648\u0639', reports: '\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631', feePaymentReport: '\u062a\u0642\u0631\u064a\u0631 \u062f\u0641\u0639 \u0627\u0644\u0631\u0633\u0648\u0645', categorySummaryReport: '\u062a\u0642\u0631\u064a\u0631 \u0645\u0644\u062e\u0635 \u0627\u0644\u0641\u0626\u0627\u062a', paymentReport: '\u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u062f\u0641\u0639', attendanceLedger: '\u0633\u062c\u0644 \u0627\u0644\u062d\u0636\u0648\u0631', usersAccess: '\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u0648\u0646 \u0648\u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0627\u062a', users: '\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u0648\u0646', rolesPermissions: '\u0627\u0644\u0623\u062f\u0648\u0627\u0631 \u0648\u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0627\u062a', logs: '\u0627\u0644\u0633\u062c\u0644\u0627\u062a', settings: '\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a', search: '\u0627\u0628\u062d\u062b \u0639\u0646 \u0623\u064a \u0634\u064a\u0621...', notifications: '\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062a', profile: '\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062e\u0635\u064a', changePassword: '\u062a\u063a\u064a\u064a\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631', logout: '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c', systemLanguage: '\u0644\u063a\u0629 \u0627\u0644\u0646\u0638\u0627\u0645', english: '\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629', somali: '\u0627\u0644\u0635\u0648\u0645\u0627\u0644\u064a\u0629', arabic: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629', languageSaved: '\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u0644\u063a\u0629 \u0648\u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0648\u0627\u062c\u0647\u0629.', languageDescription: '\u0627\u062e\u062a\u0631 \u0627\u0644\u0644\u063a\u0629 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u0629 \u0641\u064a \u0627\u0644\u062a\u0637\u0628\u064a\u0642.', systemPreferences: '\u062a\u0641\u0636\u064a\u0644\u0627\u062a \u0627\u0644\u0646\u0638\u0627\u0645', saveLanguage: '\u062d\u0641\u0638 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a', instituteManagement: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0639\u0647\u062f', signedInAs: '\u062a\u0645 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0628\u0627\u0633\u0645', openMenu: '\u0641\u062a\u062d \u0627\u0644\u0642\u0627\u0626\u0645\u0629', toggleDarkMode: '\u062a\u0628\u062f\u064a\u0644 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u062f\u0627\u0643\u0646'
};

const translations = { en: { dashboard: 'Dashboard', academicManagement: 'Academic Management', classes: 'Classes', teachers: 'Teachers', students: 'Students', classPromotion: 'Class Promotion', attendance: 'Attendance', studentAttendance: 'Student Attendance', teacherAttendance: 'Teacher Attendance', examinations: 'Examinations', exams: 'Exams', markEntry: 'Mark Entry', results: 'Results', finance: 'Finance', cashbook: 'Cashbook', payers: 'Payers', wallets: 'Wallets', instituteStructure: 'Institute Structure', branches: 'Branches', reports: 'Reports', feePaymentReport: 'Fee Payment Report', categorySummaryReport: 'Category Summary Report', paymentReport: 'Payment Report', attendanceLedger: 'Attendance Ledger', usersAccess: 'Users & Access', users: 'Users', rolesPermissions: 'Roles & Permissions', logs: 'Logs', settings: 'Settings', search: 'Search anything...', notifications: 'Notifications', profile: 'Profile', changePassword: 'Change Password', logout: 'Logout', systemLanguage: 'System language', english: 'English', somali: 'Somali', arabic: 'Arabic', systemPreferences: 'System Preferences', saveLanguage: 'Save settings', instituteManagement: 'Institute Management', openMenu: 'Open menu', toggleDarkMode: 'Toggle dark mode' }, so: { dashboard: 'Guddi-hagid', academicManagement: 'Maamulka Waxbarashada', classes: 'Fasallada', teachers: 'Macallimiinta', students: 'Ardayda', settings: 'Dejinta', logout: 'Ka bax', systemLanguage: 'Luqadda nidaamka', english: 'Ingiriisi', somali: 'Soomaali', arabic: 'Carabi', systemPreferences: 'Doorbidyada Nidaamka', saveLanguage: 'Kaydi dejimaha', instituteManagement: 'Maamulka Machadka', openMenu: 'Fur liiska', toggleDarkMode: 'Beddel habka mugdiga' }, ar };

const legacyArabic = {
  'Add': '\u0625\u0636\u0627\u0641\u0629', 'Edit': '\u062a\u0639\u062f\u064a\u0644', 'Delete': '\u062d\u0630\u0641', 'Save': '\u062d\u0641\u0638', 'Save Changes': '\u062d\u0641\u0638 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a', 'Cancel': '\u0625\u0644\u063a\u0627\u0621', 'Close': '\u0625\u063a\u0644\u0627\u0642', 'Search': '\u0628\u062d\u062b', 'Filter': '\u062a\u0635\u0641\u064a\u0629', 'Export': '\u062a\u0635\u062f\u064a\u0631', 'Print': '\u0637\u0628\u0627\u0639\u0629', 'Refresh': '\u062a\u062d\u062f\u064a\u062b', 'Actions': '\u0625\u062c\u0631\u0627\u0621\u0627\u062a', 'Status': '\u0627\u0644\u062d\u0627\u0644\u0629', 'Name': '\u0627\u0644\u0627\u0633\u0645', 'Email': '\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a', 'Phone': '\u0627\u0644\u0647\u0627\u062a\u0641', 'Address': '\u0627\u0644\u0639\u0646\u0648\u0627\u0646', 'Date': '\u0627\u0644\u062a\u0627\u0631\u064a\u062e', 'Amount': '\u0627\u0644\u0645\u0628\u0644\u063a', 'Total': '\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a', 'Description': '\u0627\u0644\u0648\u0635\u0641', 'Notes': '\u0645\u0644\u0627\u062d\u0638\u0627\u062a', 'Submit': '\u0625\u0631\u0633\u0627\u0644', 'Back': '\u0631\u062c\u0648\u0639', 'Next': '\u0627\u0644\u062a\u0627\u0644\u064a', 'Previous': '\u0627\u0644\u0633\u0627\u0628\u0642', 'View': '\u0639\u0631\u0636', 'Details': '\u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644', 'Active': '\u0646\u0634\u0637', 'Inactive': '\u063a\u064a\u0631 \u0646\u0634\u0637', 'Paid': '\u0645\u062f\u0641\u0648\u0639', 'Unpaid': '\u063a\u064a\u0631 \u0645\u062f\u0641\u0648\u0639', 'Present': '\u062d\u0627\u0636\u0631', 'Absent': '\u063a\u0627\u0626\u0628', 'Loading...': '\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0645\u064a\u0644...', 'No data available': '\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u064a\u0627\u0646\u0627\u062a', 'Create': '\u0625\u0646\u0634\u0627\u0621', 'Update': '\u062a\u062d\u062f\u064a\u062b', 'Student': '\u0637\u0627\u0644\u0628', 'Teacher': '\u0645\u0639\u0644\u0645', 'Class': '\u0641\u0635\u0644', 'Payment': '\u062f\u0641\u0639', 'Expense': '\u0645\u0635\u0631\u0648\u0641', 'Salary': '\u0631\u0627\u062a\u0628', 'User': '\u0645\u0633\u062a\u062e\u062f\u0645', 'Role': '\u062f\u0648\u0631', 'Permission': '\u0635\u0644\u0627\u062d\u064a\u0629'
};
const legacyArabicReverse = Object.fromEntries(Object.entries(legacyArabic).map(([english, arabic]) => [arabic, english]));
const translateText = (text, language) => {
  const trimmed = text.trim();
  const translated = language === 'ar' ? legacyArabic[trimmed] : legacyArabicReverse[trimmed];
  return translated ? text.replace(trimmed, translated) : text;
};
const localizeElement = (element, language) => {
  if (!element || ['SCRIPT', 'STYLE', 'TEXTAREA'].includes(element.tagName) || element.isContentEditable) return;
  ['placeholder', 'title', 'aria-label'].forEach((attribute) => {
    if (element.hasAttribute?.(attribute)) element.setAttribute(attribute, translateText(element.getAttribute(attribute), language));
  });
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((node) => { node.nodeValue = translateText(node.nodeValue, language); });
};

const LanguageContext = createContext(null);
export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => localStorage.getItem('appLanguage') || 'en');
  const setLanguage = (value) => setLanguageState(['en', 'so', 'ar'].includes(value) ? value : 'en');
  useEffect(() => {
    localStorage.setItem('appLanguage', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    const localize = (node = document.body) => localizeElement(node, language);
    localize();
    const observer = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) localize(node);
      if (node.nodeType === Node.TEXT_NODE) node.nodeValue = translateText(node.nodeValue, language);
    })));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t: (key) => translations[language][key] || translations.en[key] || key }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
};
