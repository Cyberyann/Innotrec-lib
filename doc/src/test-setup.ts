import '@testing-library/jest-dom/vitest';
window.scrollTo = () => undefined;
Element.prototype.scrollIntoView = () => undefined;
