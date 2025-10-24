document.addEventListener('DOMContentLoaded', () => {
    // 1. GLOBALNE ZMIENNE
    const preloader = document.getElementById('preloader');
    const menuItems = document.querySelectorAll('.menu-item');
    const cartItemsList = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const cartCounter = document.getElementById('cart-counter');
    const checkoutForm = document.getElementById('checkout-form');
    const orderSummaryHidden = document.getElementById('order-summary-hidden');
    const sections = document.querySelectorAll('.content-section');
    const themeToggle = document.getElementById('theme-toggle');

    let cart = [];
    const extraIngredients = [
        { name: "Ser - Dodatkowa Mozzarella (8 zł)", price: 8 },
        { name: "Mięso - Salami Picante (10 zł)", price: 10 },
        { name: "Warzywa - Oliwa Truflowa (12 zł)", price: 12 },
        { name: "Warzywa - Świeża Rukola (5 zł)", price: 5 },
        { name: "Sos - Czosnkowy (3 zł)", price: 3 },
    ];
    
    // Ustawienie zmiennej CSS --i dla płynnej animacji menu
    menuItems.forEach((item, index) => {
        item.style.setProperty('--i', index + 1);
    });

    // --- FUNKCJA WŁĄCZANIA / WYŁĄCZANIA TRYBU CIEMNEGO ---
    function toggleTheme() {
        if (document.body.classList.contains('dark-theme')) {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        }
    }
    
    // Sprawdzenie zapisanego motywu przy ładowaniu
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }

    themeToggle.addEventListener('click', toggleTheme);

    // 2. FUNKCJE KOSZYKA
    function updateCart() {
        let total = 0;
        cartItemsList.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsList.innerHTML = '<p>Wybierz pizzę z naszego menu, by dodać ją do zamówienia.</p>';
            orderSummaryHidden.value = "Koszyk jest pusty.";
        } else {
            const ul = document.createElement('ul');
            let summaryText = "--- ZAMÓWIENIE: ---\n";

            cart.forEach((item, index) => {
                total += item.price;
                const li = document.createElement('li');
                
                // Opis zamówienia na liście
                const itemName = document.createElement('span');
                itemName.innerHTML = `${item.name} <small>(${item.price.toFixed(2)} zł)</small>`;
                
                // Przycisk usuwania
                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'Usuń';
                removeBtn.classList.add('btn', 'btn-small');
                removeBtn.style.backgroundColor = '#d32f2f';
                removeBtn.style.transform = 'none';
                removeBtn.onclick = () => removeItem(index);

                li.appendChild(itemName);
                li.appendChild(removeBtn);
                ul.appendChild(li);

                summaryText += `${index + 1}. ${item.name} (${item.price.toFixed(2)} zł)\n`;
            });
            cartItemsList.appendChild(ul);
            
            // Aktualizacja ukrytego pola Formspree
            summaryText += `\n--- DO ZAPŁATY: ${total.toFixed(2)} zł ---\n`;
            orderSummaryHidden.value = summaryText;
        }

        cartTotal.innerHTML = `<strong>Do zapłaty: ${total.toFixed(2)} zł</strong>`;
        cartCounter.textContent = cart.length;
        
        // Płynne przewinięcie do sekcji zamówienia
        document.getElementById('order').scrollIntoView({ behavior: 'smooth' });
    }

    function removeItem(index) {
        cart.splice(index, 1);
        updateCart();
    }

    // 3. OBSŁUGA MODALA PERSONALIZACJI
    const modal = document.getElementById('details-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    const personalizationForm = document.getElementById('personalization-form');
    const addToCartModalBtn = document.getElementById('add-to-cart-modal-btn');
    
    closeModalBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    menuItems.forEach(item => {
        const detailsBtn = item.querySelector('.view-details-btn');
        detailsBtn.addEventListener('click', () => {
            const pizzaId = item.dataset.id;
            const pizzaName = item.dataset.name;
            const basePrice = parseFloat(item.dataset.price);
            const baseIngredients = item.dataset.baseIngredients;

            document.getElementById('modal-pizza-name').textContent = pizzaName;
            document.getElementById('modal-pizza-price').textContent = `${basePrice.toFixed(2)} zł (Cena bazowa)`;
            addToCartModalBtn.dataset.pizzaId = pizzaId;
            addToCartModalBtn.dataset.basePrice = basePrice;
            addToCartModalBtn.dataset.baseIngredients = baseIngredients;
            
            // Generowanie checkboxów dla dodatków
            personalizationForm.innerHTML = `<p class="base-ingredients">**Składniki bazowe:** ${baseIngredients}</p><hr>`;
            
            extraIngredients.forEach((extra, index) => {
                const label = document.createElement('label');
                label.innerHTML = `
                    <input type="checkbox" name="extra" value="${extra.name}" data-price="${extra.price}">
                    ${extra.name}
                `;
                personalizationForm.appendChild(label);
            });

            // Aktualizacja ceny w modalu na podstawie wybranych dodatków
            personalizationForm.onchange = () => {
                let currentPrice = basePrice;
                let selectedExtras = [];
                personalizationForm.querySelectorAll('input[name="extra"]:checked').forEach(checkbox => {
                    currentPrice += parseFloat(checkbox.dataset.price);
                    selectedExtras.push(checkbox.value.split(' (')[0]);
                });

                document.getElementById('modal-pizza-price').textContent = `${currentPrice.toFixed(2)} zł (Finalna cena)`;
                addToCartModalBtn.dataset.finalPrice = currentPrice.toFixed(2);
                addToCartModalBtn.dataset.selectedExtras = selectedExtras.join(', ');
            };

            // Ustawienie ceny początkowej i zerowanie dodatków
            document.getElementById('modal-pizza-price').textContent = `${basePrice.toFixed(2)} zł (Finalna cena)`;
            addToCartModalBtn.dataset.finalPrice = basePrice.toFixed(2);
            addToCartModalBtn.dataset.selectedExtras = '';

            modal.style.display = 'block';
        });
    });

    addToCartModalBtn.addEventListener('click', () => {
        const pizzaName = document.getElementById('modal-pizza-name').textContent;
        const finalPrice = parseFloat(addToCartModalBtn.dataset.finalPrice);
        const selectedExtras = addToCartModalBtn.dataset.selectedExtras;

        let fullName = pizzaName.replace(/\s\([^)]+\)/g, ''); // Usuń np. (Pikantna) z nazwy
        if (selectedExtras) {
            fullName += ` (+ ${selectedExtras})`;
        }

        cart.push({
            name: fullName,
            price: finalPrice
        });
        
        modal.style.display = 'none';
        updateCart();
    });


    // 4. GEOLOKALIZACJA
    function getLocation() {
        const locationLink = document.getElementById('location-link');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
                    locationLink.value = mapUrl; // Wysyłanie pinu do Formspree
                },
                (error) => {
                    console.warn('Geolocation error:', error.message);
                    locationLink.value = 'Lokalizacja: nie udostępniono';
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            locationLink.value = 'Lokalizacja: nieobsługiwana przez przeglądarkę';
        }
    }
    
    // Pobranie lokalizacji przy wejściu na stronę, aby była gotowa przy zamówieniu
    getLocation();


    // 5. ANIMACJA SEKCJI PRZY PRZEWIJANIU
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Jeśli to sekcja Menu, uruchom animację stagger dla elementów
                if (entry.target.id === 'menu') {
                    const menuItems = entry.target.querySelectorAll('.menu-item');
                    menuItems.forEach(item => {
                        item.style.animationPlayState = 'running';
                    });
                }
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1 // Uruchom, gdy 10% sekcji jest widoczne
    });

    sections.forEach(section => {
        observer.observe(section);
    });

    // 6. USUNIĘCIE PRELOADERA PO ZAŁADOWANIU
    window.addEventListener('load', () => {
        // Opóźnienie, aby animacja ładowania trwała minimum 0.5s
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 500);
    });

    // 7. OBSŁUGA FORMULARZA
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formStatus = document.getElementById('form-status');
        
        if (cart.length === 0) {
            formStatus.textContent = "❌ Koszyk jest pusty! Dodaj pizzę, aby złożyć zamówienie.";
            formStatus.style.color = '#d32f2f';
            return;
        }

        formStatus.textContent = "Wysyłanie zamówienia...";
        formStatus.style.color = 'var(--primary-color)';

        // Formspree używa FormData
        const formData = new FormData(checkoutForm);

        try {
            const response = await fetch(checkoutForm.action, {
                method: checkoutForm.method,
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                formStatus.textContent = "✅ Zamówienie przyjęte! Dziękujemy. Zostaniesz o nim poinformowany telefonicznie.";
                formStatus.style.color = 'var(--primary-color)';
                checkoutForm.reset();
                cart = []; // Czyszczenie koszyka
                updateCart(); 
            } else {
                const data = await response.json();
                if (data.errors) {
                    formStatus.textContent = '❌ Wystąpił błąd podczas wysyłki. Sprawdź poprawność danych.';
                } else {
                    formStatus.textContent = '❌ Wystąpił nieznany błąd serwera. Spróbuj ponownie.';
                }
                formStatus.style.color = '#d32f2f';
            }
        } catch (error) {
            formStatus.textContent = '❌ Wystąpił błąd sieci. Sprawdź połączenie internetowe.';
            formStatus.style.color = '#d32f2f';
        }
    });

    // Inicjalizacja koszyka na start
    updateCart(); 
});
