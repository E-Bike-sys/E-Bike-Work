// ====== УПРАВЛЕНИЕ ЗАПИСЯМИ ======

// Ключ для хранения в localStorage
const STORAGE_KEY = 'ebikeBookings';

// Получить все записи
function getBookings() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Сохранить записи
function saveBookings(bookings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

// Добавить запись
function addBooking(name, phone, workshop, date, time) {
    const bookings = getBookings();
    
    // Получаем параметры АКБ из скрытых полей
    const batteryVoltage = document.getElementById('batteryVoltageHidden')?.value || '';
    const batteryCapacity = document.getElementById('batteryCapacityHidden')?.value || '';
    const batteryType = document.getElementById('batteryTypeHidden')?.value || '';
    const batteryBMS = document.getElementById('batteryBMSHidden')?.value || '';
    const batteryPrice = document.getElementById('batteryPriceHidden')?.value || '';
    
    // Проверяем, есть ли данные из localStorage (если пришли со страницы аккумуляторов)
    const batteryDataStr = localStorage.getItem('batteryOrder');
    let batteryData = null;
    if (batteryDataStr) {
        try {
            batteryData = JSON.parse(batteryDataStr);
            localStorage.removeItem('batteryOrder');
        } catch (e) {}
    }
    
    const newBooking = {
        id: Date.now(),
        name,
        phone,
        workshop,
        date,
        time,
        createdAt: new Date().toISOString(),
        batteryVoltage: batteryData?.voltage || batteryVoltage || '',
        batteryCapacity: batteryData?.capacity || batteryCapacity || '',
        batteryType: batteryData?.type || batteryType || '',
        batteryBMS: batteryData?.bms || batteryBMS || '',
        batteryPrice: batteryData?.price || batteryPrice || '',
        status: 'new'
    };
    
    bookings.push(newBooking);
    saveBookings(bookings);
    return newBooking;
}

// Удалить запись по ID
function deleteBooking(id) {
    let bookings = getBookings();
    bookings = bookings.filter(b => b.id !== id);
    saveBookings(bookings);
}

// ====== КЛИЕНТСКАЯ ЧАСТЬ (ЗАПИСЬ) ======

const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = document.getElementById('clientName').value.trim();
        const phone = document.getElementById('clientPhone').value.trim();
        const workshop = document.getElementById('clientWorkshop').value;
        const date = document.getElementById('clientDate').value;
        const time = document.getElementById('clientTime').value;

        if (!name || !phone || !workshop || !date || !time) {
            document.getElementById('bookingMessage').textContent = '⚠️ Заполните все поля!';
            document.getElementById('bookingMessage').style.color = '#dc3545';
            return;
        }

        const bookings = getBookings();
        const isBusy = bookings.some(b => b.workshop === workshop && b.date === date && b.time === time);

        if (isBusy) {
            document.getElementById('bookingMessage').textContent = '❌ Это время уже занято! Выберите другое.';
            document.getElementById('bookingMessage').style.color = '#dc3545';
            return;
        }

        addBooking(name, phone, workshop, date, time);

        document.getElementById('bookingMessage').textContent = '✅ Вы успешно записаны! Ждём вас.';
        document.getElementById('bookingMessage').style.color = '#0077be';
        this.reset();
        
        // Очищаем сообщение о заказе АКБ через 3 секунды
        setTimeout(() => {
            const msg = document.getElementById('bookingMessage');
            if (msg && !msg.textContent.includes('✅')) {
                // ничего не делаем
            }
        }, 5000);
    });
}

// ====== ЗАПРЕТ НА ВЫБОР ПРОШЛЫХ ДАТ ======

document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('clientDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
});

// ====== НАВИГАЦИЯ ======

document.querySelectorAll('nav a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// ====== КОНСТРУКТОР СБОРКИ АКБ ======

document.addEventListener('DOMContentLoaded', function() {
    const voltageSelect = document.getElementById('batteryVoltage');
    const capacitySelect = document.getElementById('batteryCapacity');
    const typeSelect = document.getElementById('batteryType');
    const bmsSelect = document.getElementById('batteryBMS');
    const priceSpan = document.getElementById('batteryPrice');

    if (!voltageSelect || !capacitySelect || !typeSelect || !bmsSelect || !priceSpan) {
        return;
    }

    const PRICE_PER_AH = {
        liion: {
            12: 500,
            24: 700,
            36: 1000,
            48: 1100,
            60: 1250,
            72: 1500
        },
        lifepo4: {
            12: 500,
            24: 700,
            36: 1000,
            48: 1100,
            60: 1250,
            72: 1500
        }
    };

    function getPricePerAh(voltage, capacity, type) {
        const typeKey = type || 'liion';
        if (voltage === 12) {
            if (capacity <= 20) return 500;
            if (capacity <= 100) return 250;
        }
        return PRICE_PER_AH[typeKey]?.[voltage] || 500;
    }

    const BMS_PRICES = {
        none: 0,
        huayang: 2000,
        premium: 5000
    };

    function calculateBatteryPrice() {
        const voltage = parseInt(voltageSelect.value);
        const capacity = parseInt(capacitySelect.value);
        const type = typeSelect.value;
        const bms = bmsSelect.value;
        
        const pricePerAh = getPricePerAh(voltage, capacity, type);
        const basePrice = capacity * pricePerAh;
        const bmsPrice = BMS_PRICES[bms] || 0;
        const totalPrice = basePrice + bmsPrice;
        
        priceSpan.textContent = totalPrice.toLocaleString('ru-RU');
    }

    voltageSelect.addEventListener('change', calculateBatteryPrice);
    capacitySelect.addEventListener('change', calculateBatteryPrice);
    typeSelect.addEventListener('change', calculateBatteryPrice);
    bmsSelect.addEventListener('change', calculateBatteryPrice);
    
    setTimeout(calculateBatteryPrice, 200);
});

// ====== ТРОЙНОЙ КЛИК ПО ЛОГОТИПУ ======

let logoClickCount = 0;
let logoTimer = null;

document.addEventListener('DOMContentLoaded', function() {
    const logo = document.getElementById('mainLogo');
    if (!logo) return;

    logo.addEventListener('click', function(e) {
        const isIndexPage = window.location.pathname.endsWith('index.html') || 
                            window.location.pathname === '/' || 
                            window.location.pathname === '';
        
        if (!isIndexPage) {
            e.preventDefault();
            window.location.href = 'index.html';
            return;
        }

        e.preventDefault();
        
        logoClickCount++;

        if (logoClickCount === 1) {
            logoTimer = setTimeout(() => {
                window.location.href = 'index.html';
                logoClickCount = 0;
            }, 500);
        } else if (logoClickCount >= 3) {
            clearTimeout(logoTimer);
            logoClickCount = 0;
            window.location.href = 'admin.html';
        }
    });
});

// ====== ПЕРЕДАЧА ПАРАМЕТРОВ АКБ В ФОРМУ ЗАПИСИ ======

document.addEventListener('DOMContentLoaded', function() {
    const orderBtn = document.getElementById('orderBatteryBtn');
    if (!orderBtn) return;

    orderBtn.addEventListener('click', function(e) {
        e.preventDefault();

        const voltage = document.getElementById('batteryVoltage')?.value || '';
        const capacity = document.getElementById('batteryCapacity')?.value || '';
        const type = document.getElementById('batteryType')?.value || '';
        const bms = document.getElementById('batteryBMS')?.value || '';
        const price = document.getElementById('batteryPrice')?.textContent || '';

        const batteryData = {
            voltage: voltage + 'V',
            capacity: capacity + ' Ah',
            type: type === 'liion' ? 'Li-ion' : 'LiFePO4',
            bms: bms === 'none' ? 'Без BMS' : (bms === 'huayang' ? 'Бюджет (Хуаянг)' : 'Премиум (ANT/Jikong)'),
            price: price + ' ₽'
        };
        localStorage.setItem('batteryOrder', JSON.stringify(batteryData));

        window.location.href = 'index.html#booking';
    });
});

// ====== ПРИ ЗАГРУЗКЕ ГЛАВНОЙ СТРАНИЦЫ — ЗАПОЛНЯЕМ СКРЫТЫЕ ПОЛЯ ======

document.addEventListener('DOMContentLoaded', function() {
    const batteryDataStr = localStorage.getItem('batteryOrder');
    if (!batteryDataStr) return;

    try {
        const batteryData = JSON.parse(batteryDataStr);
        
        const hiddenFields = {
            'batteryVoltageHidden': batteryData.voltage || '',
            'batteryCapacityHidden': batteryData.capacity || '',
            'batteryTypeHidden': batteryData.type || '',
            'batteryBMSHidden': batteryData.bms || '',
            'batteryPriceHidden': batteryData.price || ''
        };

        for (const [id, value] of Object.entries(hiddenFields)) {
            const field = document.getElementById(id);
            if (field) field.value = value;
        }

        const messageEl = document.getElementById('bookingMessage');
        if (messageEl) {
            messageEl.innerHTML = `
                🔋 <strong>Заказ сборки АКБ:</strong><br>
                ${batteryData.voltage} / ${batteryData.capacity} / ${batteryData.type}<br>
                BMS: ${batteryData.bms} | Цена: ${batteryData.price}
            `;
            messageEl.style.color = '#0077be';
            messageEl.style.background = '#e8f0fe';
            messageEl.style.padding = '12px 18px';
            messageEl.style.borderRadius = '12px';
            messageEl.style.border = '1px solid #d0dce8';
            messageEl.style.marginBottom = '15px';
            messageEl.style.fontSize = '14px';
        }
        
    } catch (e) {
        console.log('Ошибка чтения данных АКБ:', e);
    }
});