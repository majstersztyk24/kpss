document.addEventListener('DOMContentLoaded', () => {

    // --- LOGIKA KOSZYKA ZAMÓWIEŃ Z LICZNIKIEM ---
    let cart = [];
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
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
            cart.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${item.name}</span> <strong>${item.price.toFixed(2)} zł</strong>`;
                ul.appendChild(li);
            });
            cartItemsContainer.appendChild(ul);
            cartCounter.textContent = cart.length;
            cartCounter.style.display = 'inline-block';
        }

        const total = cart.reduce((sum, item) => sum + item.price, 0);
        cartTotalElement.innerHTML = `<strong>Do zapłaty: ${total.toFixed(2)} zł</strong>`;

        const summaryText = cart.map(item => `${item.name} - ${item.price.toFixed(2)} zł`).join('\n') + `\n\nSuma: ${total.toFixed(2)} zł`;
        orderSummaryHidden.value = summaryText;
    }

    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const name = e.target.dataset.name;
            const price = parseFloat(e.target.dataset.price);
            
            cart.push({ name, price });
            updateCartDisplay();
            
            e.target.textContent = 'Dodano!';
            e.target.style.backgroundColor = '#28a745'; // Zielony kolor potwierdzenia
            setTimeout(() => {
                e.target.textContent = e.target.classList.contains('btn-small') ? 'Dodaj' : 'Dodaj do zamówienia';
                e.target.style.backgroundColor = ''; // Wróć do oryginalnego koloru
            }, 1200);
        });
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
            status.style.color = '#f39c12';
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
                status.style.color = '#28a745';
                form.reset();
                cart = [];
                updateCartDisplay();
            } else {
                response.json().then(data => {
                    status.textContent = data.errors ? data.errors.map(e => e.message).join(", ") : "Oops! Coś poszło nie tak.";
                    status.style.color = 'red';
                });
            }
        }).catch(error => {
            status.textContent = "Oops! Wystąpił błąd sieci. Spróbuj ponownie.";
            status.style.color = 'red';
        });
    }
    form.addEventListener("submit", handleSubmit);

    updateCartDisplay(); // Inicjalizacja widoku koszyka
});
