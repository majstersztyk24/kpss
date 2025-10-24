document.addEventListener('DOMContentLoaded', () => {

    // KRYTYCZNA POPRAWKA PRELOADERA: Ustawienie timera bezpieczeństwa.
    // Jeśli strona załaduje się szybko, preloader jest ukrywany natychmiast.
    // Jeśli loader się nie rusza, timer wymusi jego zniknięcie po 0.5 sekundy.
    const preloaderElement = document.getElementById('preloader');
    
    // Zegar bezpieczeństwa na 500ms
    const safetyTimer = setTimeout(() => {
        document.body.classList.add('loaded');
    }, 500);

    // Właściwe zdarzenie ładowania
    window.addEventListener('load', () => {
        clearTimeout(safetyTimer); // Anuluj timer bezpieczeństwa, jeśli zdarzenie load się uruchomi
        document.body.classList.add('loaded');
    });

    // Ustawienie zmiennej CSS --i dla każdego menu-item do płynnej animacji (Stagger)
    document.querySelectorAll('.menu-item').forEach((item, index) => {
        item.style.setProperty('--i', index + 1);
    });

    // --- LOGIKA KOSZYKA ZAMÓWIEŃ Z LICZNIKIEM ---
    let cart = [];
    const viewDetailsButtons = document.querySelectorAll('.view-details-btn');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const orderSummaryHidden = document.getElementById('order-summary-hidden');
    const cartCounter = document.getElementById('cart-counter');

    function updateCartDisplay() {
        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Wybierz pizzę z naszego menu, by dodać ją do zamówienia.</p>';
            cartCounter.style.display = 'none';
        } else {
            const ul = document.createElement('ul');
            cart.forEach((item, index) => {
                const li = document.createElement('li');
                li.className = 'cart-item';
                
                // Uproszczony opis składników dla koszyka
                const ingredientsText = item.removed.length > 0 ? 
                    `<br><small style="color: #E53935; font-style: italic; display: block; margin-top: 3px;">Bez: ${item.removed.join(', ')}</small>` : '';

                li.innerHTML = `
                    <div style="flex-grow: 1;">
                        <span style="font-weight: 500;">${item.name}</span>
                        ${ingredientsText}
                    </div>
                    <strong>${item.price.toFixed(2)} zł</strong>
                `;
                ul.appendChild(li);
            });
            cartItemsContainer.appendChild(ul);
            cartCounter.textContent = cart.length;
            cartCounter.style.display = 'inline-block';
        }

        const total = cart.reduce((sum, item) => sum + item.price, 0);
        cartTotalElement.innerHTML = `<strong>Do zapłaty: ${total.toFixed(2)} zł</strong>`;

        // Generowanie podsumowania dla Formspree
        const summaryText = cart.map((item, index) => {
            const removed = item.removed.length > 0 ? ` (Bez: ${item.removed.join(', ')})` : '';
            return `${index + 1}. ${item.name}${removed} - ${item.price.toFixed(2)} zł`;
        }).join('\n') + `\n\nSuma: ${total.toFixed(2)} zł`;
        orderSummaryHidden.value = summaryText;
    }

    // --- LOGIKA MODALA PERSONALIZACJI ---
    const modal = document.getElementById('details-modal');
    const closeBtn = document.querySelector('.close-btn');
    const modalPizzaName = document.getElementById('modal-pizza-name');
    const modalPizzaPrice = document.getElementById('modal-pizza-price');
    const personalizationForm = document.getElementById('personalization-form');
    const addToCartModalBtn = document.getElementById('add-to-cart-modal-btn');
    
    let currentPizza = null; // Przechowuje dane aktualnie wybranej pizzy

    viewDetailsButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const item = e.target.closest('.menu-item');
            
            // Pobieranie danych z atrybutów data-
            const name = item.dataset.name;
            const price = parseFloat(item.dataset.price);
            const ingredientsString = item.dataset.baseIngredients;
            const ingredientsArray = ingredientsString.split(',').map(s => s.trim());
            
            currentPizza = { name, price, ingredients: ingredientsArray };

            // Wypełnianie modala
            modalPizzaName.textContent = name;
            modalPizzaPrice.textContent = price.toFixed(2) + ' zł';
            
            // Tworzenie checkboxów
            personalizationForm.innerHTML = '';
            ingredientsArray.forEach((ing) => {
                const label = document.createElement('label');
                label.innerHTML = `
                    <input type="checkbox" name="ingredient" value="${ing}" checked> 
                    ${ing}
                `;
                personalizationForm.appendChild(label);
            });

            // Wyświetlanie modala
            modal.style.display = 'block';
        });
    });

    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
    
    // Dodawanie spersonalizowanej pizzy do koszyka
    addToCartModalBtn.addEventListener('click', () => {
        const removedIngredients = [];
        const checkboxes = personalizationForm.querySelectorAll('input[type="checkbox"]');
        
        checkboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                removedIngredients.push(checkbox.value);
            }
        });

        // Dodanie spersonalizowanej pizzy do koszyka
        cart.push({
            name: currentPizza.name,
            price: currentPizza.price,
            removed: removedIngredients
        });

        updateCartDisplay();
        modal.style.display = 'none';
        
        // Wizualne potwierdzenie (Płynne przejście koloru)
        const btn = document.querySelector(`.menu-item[data-name="${currentPizza.name}"] .view-details-btn`);
        if (btn) {
            const originalText = btn.textContent;
            const originalBg = btn.style.backgroundColor;
            const originalColor = btn.style.color;
            
            btn.textContent = 'Dodano!';
            btn.style.transition = 'background-color 0.4s, color 0.4s';
            btn.style.backgroundColor = '#28a745'; // Zielone potwierdzenie
            btn.style.color = '#fff';
            
            setTimeout(() => {
                // Przywrócenie oryginalnych wartości po animacji
                btn.textContent = originalText;
                btn.style.backgroundColor = originalBg; 
                btn.style.color = originalColor;
                // Jeśli nie miał ustawionych styli inline, przywróć domyślne z CSS
                if (!originalBg) btn.style.backgroundColor = 'var(--primary-color)';
            }, 1200);
        }
    });


    // --- ANIMACJE PRZY PRZEWIJANIU ---
    const sections = document.querySelectorAll('.content-section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    sections.forEach(section => observer.observe(section));

    // --- OBSŁUGA FORMULARZA I GEOLOKALIZACJI ---
    const form = document.getElementById("checkout-form");
    const status = document.getElementById("form-status");
    const locationInput = document.getElementById("location-link");

    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    locationInput.value = `https://www.google.com/maps?q=${lat},${lon}`;
                },
                () => { locationInput.value = "Użytkownik nie udostępnił lokalizacji."; }
            );
        } else {
            locationInput.value = "Geolokalizacja niewspierana.";
        }
    }
    getLocation();

    async function handleSubmit(event) {
        event.preventDefault();
        if (cart.length === 0) {
            status.textContent = "Twój koszyk jest pusty!";
            status.style.color = '#E53935';
            return;
        }

        const data = new FormData(event.target);
        fetch(event.target.action, {
            method: form.method,
            body: data,
            headers: { 'Accept': 'application/json' }
        }).then(response => {
            if (response.ok) {
                status.textContent = "Dziękujemy! Twoje zamówienie zostało wysłane.";
                status.style.color = 'var(--primary-color)';
                form.reset();
                cart = [];
                updateCartDisplay();
            } else {
                response.json().then(data => {
                    status.textContent = data.errors ? data.errors.map(e => e.message).join(", ") : "Oops! Coś poszło nie tak.";
                    status.style.color = '#E53935';
                });
            }
        }).catch(error => {
            status.textContent = "Oops! Wystąpił błąd sieci. Spróbuj ponownie.";
            status.style.color = '#E53935';
        });
    }
    form.addEventListener("submit", handleSubmit);

    updateCartDisplay(); // Inicjalizacja widoku koszyka
});
