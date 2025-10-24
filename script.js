window.addEventListener('DOMContentLoaded', (event) => {

    // --- Obsługa formularza zamówienia ---
    const form = document.getElementById("order-form");
    const status = document.getElementById("form-status");
    const locationInput = document.getElementById("location-link");

    // Funkcja do pobierania lokalizacji GPS
    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition, showError);
        } else {
            console.log("Geolokalizacja nie jest wspierana przez tę przeglądarkę.");
        }
    }

    // Funkcja wywoływana, gdy lokalizacja zostanie pomyślnie pobrana
    function showPosition(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const mapsLink = `https://www.google.com/maps?q=${lat},${lon}`;
        
        // Wstawienie linku do ukrytego pola w formularzu
        locationInput.value = mapsLink;
        console.log("Pobrano lokalizację: " + mapsLink);
    }

    // Funkcja do obsługi błędów geolokalizacji
    function showError(error) {
        let errorMessage = "";
        switch(error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = "Użytkownik odmówił zgody na geolokalizację.";
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = "Informacje o lokalizacji są niedostępne.";
                break;
            case error.TIMEOUT:
                errorMessage = "Przekroczono czas oczekiwania na lokalizację.";
                break;
            case error.UNKNOWN_ERROR:
                errorMessage = "Wystąpił nieznany błąd.";
                break;
        }
        console.warn(errorMessage);
        // Można zostawić puste, bo nawet bez lokalizacji zamówienie ma dojść
        locationInput.value = "Nie udało się pobrać lokalizacji: " + errorMessage;
    }

    // Pobierz lokalizację od razu po załadowaniu strony
    // Przeglądarka zapyta o zgodę
    getLocation();

    // Funkcja do wysyłania formularza
    async function handleSubmit(event) {
        event.preventDefault(); // Zatrzymaj domyślną wysyłkę
        
        const data = new FormData(event.target);
        fetch(event.target.action, {
            method: form.method,
            body: data,
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
            if (response.ok) {
                status.textContent = "Dziękujemy za zamówienie! Wkrótce się odezwiemy.";
                status.style.color = 'green';
                form.reset(); // Wyczyść formularz
            } else {
                response.json().then(data => {
                    if (Object.hasOwn(data, 'errors')) {
                        status.textContent = data["errors"].map(error => error["message"]).join(", ");
                    } else {
                        status.textContent = "Oops! Wystąpił problem z wysłaniem formularza.";
                    }
                    status.style.color = 'red';
                })
            }
        }).catch(error => {
            status.textContent = "Oops! Wystąpił problem z wysłaniem formularza.";
            status.style.color = 'red';
        });
    }

    form.addEventListener("submit", handleSubmit);
});
