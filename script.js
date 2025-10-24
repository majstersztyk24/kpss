document.addEventListener('DOMContentLoaded', () => {

    // --- LOGIKA KOSZYKA ZAMÓWIEŃ ---
    let cart = [];
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const orderSummaryHidden = document.getElementById('order-summary-hidden');

    function updateCartDisplay() {
        // Wyczyść aktualny widok koszyka
        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Twój koszyk jest pusty. Wybierz coś z menu!</p>';
        } else {
            const ul = document.createElement('ul');
            cart.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${item.name}</span> <strong>${item.price.toFixed(2)} zł</strong>`;
                ul.appendChild(li);
            });
            cartItemsContainer.appendChild(ul);
        }

        // Oblicz i wyświetl sumę
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        cartTotalElement.innerHTML = `<strong>Do zapłaty: ${total.toFixed(2)} zł</strong>`;

        // Zaktualizuj ukryte pole dla Formspree
        const summaryText = cart.map(item => `${item.name} - ${item.price.toFixed(2)} zł`).join('\n');
        orderSummaryHidden.value = summaryText;
    }

    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const name = e.target.dataset.name;
            const price = parseFloat(e.target.dataset.price);
            
            cart.push({ name, price });
            updateCartDisplay();
            
            // Pokaż wizualne potwierdzenie
            e.target.textContent = 'Dodano!';
            setTimeout(() => {
                e.target.textContent = e.target.classList.contains('btn-small') ? 'Dodaj' : 'Dodaj do zamówienia';
            }, 1000);
        });
    });
    
    // --- ANIMACJE PRZY PRZEWIJANIU (Intersection Observer) ---
    const sections = document.querySelectorAll('.content-section');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    // --- OBSŁUGA FORMULARZA I GEOLOKALIZACJI ---
    const form = document.getElementById("checkout-form");
    const status = document.getElementById("form-status");
    const locationInput = document.getElementById("location-link");

    // Prośba o lokalizację
    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const mapsLink = `https://www.google.com/maps?q=${lat},${lon}`;
                    locationInput.value = mapsLink;
                    console.log("Pobrano lokalizację: " + mapsLink);
                },
                (error) => {
                    console.warn(`Błąd geolokalizacji: ${error.message}`);
                    locationInput.value = "Użytkownik nie udostępnił lokalizacji.";
                }
            );
        } else {
            console.log("Geolokalizacja nie jest wspierana przez przeglądarkę.");
            locationInput.value = "Geolokalizacja niewspierana.";
        }
    }

    getLocation(); // Uruchom pobieranie lokalizacji od razu

    // Wysyłka formularza
    async function handleSubmit(event) {
        event.preventDefault();
        
        if (cart.length === 0) {
            status.textContent = "Twój koszyk jest pusty! Dodaj coś do zamówienia.";
            status.style.color = 'orange';
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
                status.style.color = 'lightgreen';
                form.reset();
                cart = []; // Wyczyść koszyk
                updateCartDisplay(); // Zaktualizuj widok
            } else {
                response.json().then(data => {
                    status.textContent = data.errors ? data.errors.map(error => error.message).join(", ") : "Oops! Coś poszło nie tak.";
                    status.style.color = 'red';
                });
            }
        }).catch(error => {
            status.textContent = "Oops! Wystąpił błąd sieci. Spróbuj ponownie.";
            status.style.color = 'red';
        });
    }

    form.addEventListener("submit", handleSubmit);

    // Zainicjuj widok koszyka przy starcie
    updateCartDisplay();
});
