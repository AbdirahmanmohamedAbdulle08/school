const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

const phoneVariants = (value) => {
    const d = digitsOnly(value);
    if (!d) return [];
    const set = new Set([d]);
    if (d.length === 9 && (d.startsWith('61') || d.startsWith('62'))) {
        set.add(`0${d}`);
    }
    if (d.length === 10 && d.startsWith('0')) {
        set.add(d.slice(1));
    }
    return [...set];
};

const isValidSomaliMobile = (value) => {
    const d = digitsOnly(value);
    if (d.length === 9 && (d.startsWith('61') || d.startsWith('62'))) return true;
    if (d.length === 10 && (d.startsWith('061') || d.startsWith('062'))) return true;
    return false;
};

module.exports = {
    digitsOnly,
    phoneVariants,
    isValidSomaliMobile
};
