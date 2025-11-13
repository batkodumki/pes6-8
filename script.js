// Структура робочої пам'яті (факти)
let facts = {
    f1: false, // вентиль гарячої води відкритий
    f2: false, // вентиль холодної води відкритий
    f3: false, // вентиль гарячої води повністю відкритий
    f4: false, // вентиль холодної води повністю відкритий
    f5: false, // вода гаряча
    f6: false, // вода холодна
    f7: false, // вода тепла (мета)
    f8: 1      // крок відкриття вентиля
};

// База продукційних правил
// Формат: <номер, A (ядро), P (умова), дія>
const rules = [
    {
        id: 1,
        a: () => facts.f1 && facts.f5,
        p: () => !facts.f4 && !facts.f7,
        action: 'openColdValve',
        aDescription: 'f1 ∧ f5',
        pDescription: '¬f4 ∧ ¬f7',
        actionDescription: 'ВідкритиВентильХолодноїВодиНа(f8)',
        explanation: 'Вода занадто гаряча і вентиль гарячої води відкритий. Відкриваємо вентиль холодної води на крок f8.'
    },
    {
        id: 2,
        a: () => facts.f2 && facts.f6,
        p: () => !facts.f3 && !facts.f7,
        action: 'openHotValve',
        aDescription: 'f2 ∧ f6',
        pDescription: '¬f3 ∧ ¬f7',
        actionDescription: 'ВідкритиВентильГарячоїВодиНа(f8)',
        explanation: 'Вода занадто холодна і вентиль холодної води відкритий. Відкриваємо вентиль гарячої води на крок f8.'
    },
    {
        id: 3,
        a: () => facts.f1 && facts.f2 && facts.f5,
        p: () => facts.f3 && !facts.f7,
        action: 'closeHotValve',
        aDescription: 'f1 ∧ f2 ∧ f5',
        pDescription: 'f3 ∧ ¬f7',
        actionDescription: 'ЗакритиВентильГарячоїВоди()',
        explanation: 'Обидва вентилі відкриті, вода гаряча, і вентиль гарячої води повністю відкритий. Закриваємо вентиль гарячої води.'
    },
    {
        id: 4,
        a: () => facts.f1 && facts.f2 && facts.f6,
        p: () => facts.f4 && !facts.f7,
        action: 'closeColdValve',
        aDescription: 'f1 ∧ f2 ∧ f6',
        pDescription: 'f4 ∧ ¬f7',
        actionDescription: 'ЗакритиВентильХолодноїВоди()',
        explanation: 'Обидва вентилі відкриті, вода холодна, і вентиль холодної води повністю відкритий. Закриваємо вентиль холодної води.'
    }
];

// Масиви для протоколів
let protocolLog = [];
let explanationLog = [];

// Ініціалізація при завантаженні сторінки
window.onload = function() {
    updateFacts();
};

// Оновлення відображення фактів
function updateFacts() {
    for (let i = 1; i <= 7; i++) {
        const checkbox = document.getElementById('f' + i);
        const status = document.getElementById('status-f' + i);
        if (checkbox && status) {
            facts['f' + i] = checkbox.checked;
            status.textContent = checkbox.checked ? 'true' : 'false';
            status.className = 'status ' + (checkbox.checked ? 'true' : 'false');
            if (i === 7) status.className += ' goal';
        }
    }

    const f8Input = document.getElementById('f8');
    if (f8Input) {
        facts.f8 = parseInt(f8Input.value) || 1;
    }
}

// Синхронізація фактів з інтерфейсом
function syncFactsToUI() {
    for (let i = 1; i <= 7; i++) {
        const checkbox = document.getElementById('f' + i);
        const status = document.getElementById('status-f' + i);
        if (checkbox && status) {
            checkbox.checked = facts['f' + i];
            status.textContent = facts['f' + i] ? 'true' : 'false';
            status.className = 'status ' + (facts['f' + i] ? 'true' : 'false');
            if (i === 7) status.className += ' goal';
        }
    }

    const f8Input = document.getElementById('f8');
    if (f8Input) {
        f8Input.value = facts.f8;
    }
}

// Дії продукційних правил (відповідно до прикладу з ЛР5)
function openColdValve() {
    const oldFacts = { ...facts };

    // Згідно з прикладом: f4 стає true, f2 стає false
    facts.f4 = true;  // Вентиль холодної води повністю відкритий
    facts.f2 = false;

    return {
        action: 'ВідкритиВентильХолодноїВодиНа(' + facts.f8 + ')',
        changes: getFactChanges(oldFacts, facts)
    };
}

function openHotValve() {
    const oldFacts = { ...facts };

    // Згідно з прикладом: f3 стає true
    facts.f3 = true;  // Вентиль гарячої води повністю відкритий

    return {
        action: 'ВідкритиВентильГарячоїВодиНа(' + facts.f8 + ')',
        changes: getFactChanges(oldFacts, facts)
    };
}

function closeHotValve() {
    const oldFacts = { ...facts };

    facts.f1 = false;
    facts.f3 = false;

    return {
        action: 'ЗакритиВентильГарячоїВоди()',
        changes: getFactChanges(oldFacts, facts)
    };
}

function closeColdValve() {
    const oldFacts = { ...facts };

    facts.f2 = false;
    facts.f4 = false;

    return {
        action: 'ЗакритиВентильХолодноїВоди()',
        changes: getFactChanges(oldFacts, facts)
    };
}

// Порівняння фактів для виявлення змін
function getFactChanges(oldFacts, newFacts) {
    const changes = [];
    for (let key in oldFacts) {
        if (oldFacts[key] !== newFacts[key]) {
            changes.push(`${key}: ${oldFacts[key]} → ${newFacts[key]}`);
        }
    }
    return changes;
}

// Виконання дії за назвою
function executeAction(actionName) {
    switch (actionName) {
        case 'openColdValve':
            return openColdValve();
        case 'openHotValve':
            return openHotValve();
        case 'closeHotValve':
            return closeHotValve();
        case 'closeColdValve':
            return closeColdValve();
        default:
            return { action: 'Невідома дія', changes: [] };
    }
}

// Головний алгоритм логічного виводу
function runAlgorithm() {
    // Отримуємо поточні значення з інтерфейсу
    updateFacts();

    // Очищуємо протоколи
    protocolLog = [];
    explanationLog = [];

    // Додаємо початковий стан
    addToProtocol('=== ПОЧАТОК РОБОТИ АЛГОРИТМУ ===', 'step');
    addToProtocol('Початковий стан фактів:', 'step');
    addToProtocol(`f1=${facts.f1}, f2=${facts.f2}, f3=${facts.f3}, f4=${facts.f4}, f5=${facts.f5}, f6=${facts.f6}, f7=${facts.f7}, f8=${facts.f8}`, 'step');

    addToExplanation('Розпочинаємо роботу експертної системи для налаштування температури води.', 'step');
    addToExplanation('Мета: досягти теплої води (f7 = true).', 'step');

    const MAX_ITERATIONS = 20;  // Обмеження для запобігання нескінченному циклу
    let iteration = 0;
    let ruleExecuted = true;

    while (ruleExecuted && iteration < MAX_ITERATIONS) {
        iteration++;
        ruleExecuted = false;

        addToProtocol(`\n--- Ітерація ${iteration} ---`, 'step');

        // Перевірка цільового стану
        if (facts.f7) {
            addToProtocol('✓ Досягнуто цільовий стан: f7 = true (вода тепла)', 'success');
            addToExplanation('✓ Успіх! Система досягла цільового стану: вода тепла.', 'success');
            break;
        }

        // Перевіряємо правила у порядку 1 → 4
        for (let rule of rules) {
            addToProtocol(`\nПродукція ${rule.id}:`, 'step');

            const pValue = rule.p();
            addToProtocol(`Блок P: «${rule.pDescription}» = ${pValue ? 1 : 0}`, 'step');

            if (!pValue) {
                addToProtocol(`Ядро продукції ${rule.id} не буде активоване (P = 0)`, 'step');
                addToProtocol('Перехід до наступної продукції', 'step');
                continue;
            }

            addToProtocol('Переходимо до ядра продукції (оскільки P = 1) і намагаємося його активувати', 'step');
            const aValue = rule.a();
            addToProtocol(`Блок A: «${rule.aDescription}» = ${aValue ? 1 : 0}`, 'step');

            if (aValue) {
                // Правило спрацювало
                addToProtocol(`✓ Ядро продукції ${rule.id} АКТИВОВАНЕ`, 'success');
                addToExplanation(
                    `Крок ${iteration}. Умови правила ${rule.id} виконані. ${rule.explanation}`,
                    'step'
                );

                // Виконуємо дію
                const result = executeAction(rule.action);

                addToProtocol(`Викликається функція: ${result.action}`, 'step');
                if (result.changes.length > 0) {
                    result.changes.forEach(change => {
                        addToProtocol(`Змінено: ${change}`, 'step');
                    });
                    addToExplanation(`Змінено факти: ${result.changes.join(', ')}`, 'step');
                }

                addToProtocol('Оскільки ядро продукції було активоване, алгоритм переходить на початок списку продукцій', 'step');
                addToProtocol(`Новий стан: f1=${facts.f1}, f2=${facts.f2}, f3=${facts.f3}, f4=${facts.f4}, f5=${facts.f5}, f6=${facts.f6}, f7=${facts.f7}, f8=${facts.f8}`, 'step');

                // Синхронізуємо інтерфейс
                syncFactsToUI();

                ruleExecuted = true;

                // Повертаємося на початок
                break;
            } else {
                addToProtocol(`Ядро продукції ${rule.id} не буде активоване (A = 0)`, 'step');
                addToProtocol('Перехід до наступної продукції', 'step');
            }
        }

        if (!ruleExecuted) {
            addToProtocol('✗ Експертна система опинилася у стані, коли більше немає активних правил для подальшого виконання', 'warning');

            if (!facts.f7) {
                addToExplanation(
                    '✗ Система не може більше змінити стан: немає активних правил, вода не стала теплою.',
                    'error'
                );
            }
        }
    }

    if (iteration >= MAX_ITERATIONS) {
        addToProtocol('⚠ Досягнуто максимальну кількість ітерацій', 'warning');
        addToExplanation('⚠ Алгоритм завершено після максимальної кількості кроків.', 'warning');
    }

    addToProtocol('\n=== КІНЕЦЬ РОБОТИ АЛГОРИТМУ ===', 'step');
    addToProtocol(`Фінальний стан: f1=${facts.f1}, f2=${facts.f2}, f3=${facts.f3}, f4=${facts.f4}, f5=${facts.f5}, f6=${facts.f6}, f7=${facts.f7}, f8=${facts.f8}`, 'step');
    addToProtocol(`Загальна кількість ітерацій: ${iteration}`, 'step');

    // Відображаємо протоколи
    displayProtocol();
    displayExplanations();
}

// Додавання запису до протоколу
function addToProtocol(message, type = 'step') {
    protocolLog.push({ message, type });
}

// Додавання пояснення
function addToExplanation(message, type = 'step') {
    explanationLog.push({ message, type });
}

// Відображення протоколу
function displayProtocol() {
    const protocolDiv = document.getElementById('protocol');
    protocolDiv.innerHTML = '';

    protocolLog.forEach(entry => {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry ' + entry.type;
        logEntry.textContent = entry.message;
        protocolDiv.appendChild(logEntry);
    });

    // Прокрутка вниз
    protocolDiv.scrollTop = protocolDiv.scrollHeight;
}

// Відображення пояснень
function displayExplanations() {
    const explanationsDiv = document.getElementById('explanations');
    explanationsDiv.innerHTML = '';

    explanationLog.forEach(entry => {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry ' + entry.type;
        logEntry.textContent = entry.message;
        explanationsDiv.appendChild(logEntry);
    });

    // Прокрутка вниз
    explanationsDiv.scrollTop = explanationsDiv.scrollHeight;
}

// Очищення протоколів
function clearProtocol() {
    protocolLog = [];
    explanationLog = [];

    document.getElementById('protocol').innerHTML = '';
    document.getElementById('explanations').innerHTML = '';
}

// Скидання до початкових значень
function resetFacts() {
    facts = {
        f1: false,
        f2: false,
        f3: false,
        f4: false,
        f5: false,
        f6: false,
        f7: false,
        f8: 1
    };

    syncFactsToUI();
    clearProtocol();
}
