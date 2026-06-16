# Google Login einrichten (Issue #17)

Der Code ist jetzt vorbereitet: Es gibt eine Callback-Route unter
`app/auth/callback/route.ts`, die den von Supabase zurückgegebenen Code gegen
eine Session eintauscht. Der Button „Mit Google fortfahren" ruft bereits
`signInWithOAuth({ provider: "google" })` auf.

Der Fehler

```json
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```

bedeutet, dass der **Google-Provider in Supabase noch nicht aktiviert** ist. Das
ist reine Konfiguration und muss von dir im Google- und im Supabase-Dashboard
erledigt werden – das lässt sich nicht im Code lösen.

## 1. Google Cloud Console

1. Öffne <https://console.cloud.google.com/> und lege ein Projekt an (oder wähle ein bestehendes).
2. Gehe zu **APIs & Services → OAuth consent screen**.
   - User Type: **External**, Status auf **In production** oder Testnutzer hinzufügen.
   - App-Name, Support-E-Mail und Entwickler-Kontakt ausfüllen.
3. Gehe zu **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (lokale Entwicklung)
     - `https://DEINE-DOMAIN` (Produktion, z. B. die Vercel-URL)
   - **Authorized redirect URIs** – hier kommt die **Supabase-Callback-URL** rein
     (nicht die der App!):
     - `https://<DEIN-PROJEKT-REF>.supabase.co/auth/v1/callback`
4. **Client ID** und **Client Secret** kopieren.

## 2. Supabase Dashboard

1. Öffne dein Projekt → **Authentication → Providers → Google**.
2. **Enable Sign in with Google** aktivieren.
3. **Client ID** und **Client Secret** aus Schritt 1 einfügen und speichern.
4. Unter **Authentication → URL Configuration**:
   - **Site URL**: `https://DEINE-DOMAIN` (bzw. `http://localhost:3000` lokal).
   - **Redirect URLs** ergänzen:
     - `http://localhost:3000/auth/callback`
     - `https://DEINE-DOMAIN/auth/callback`

> Wichtig: In Google trägst du die **Supabase**-Callback-URL
> (`.../auth/v1/callback`) ein, in Supabase die **App**-Callback-URL
> (`.../auth/callback`). Diese App-Route existiert jetzt im Code.

## 3. Profil-Trigger (optional, empfohlen)

Beim Login per E-Mail wird der Benutzername aus dem Formular übernommen. Bei
Google gibt es kein Formular. Falls eine Datenbank-Funktion/Trigger existiert,
die beim Anlegen eines Users automatisch eine Zeile in `profiles` schreibt,
solltest du dort einen Fallback-Benutzernamen setzen (z. B. den Teil der E-Mail
vor dem `@` oder den Google-Anzeigenamen aus `raw_user_meta_data`), damit
Google-Nutzer auch in der Bestenliste auftauchen.

## 4. Testen

1. App starten (`npm run dev`).
2. Auf „Mit Google fortfahren" klicken.
3. Nach der Google-Zustimmung wirst du auf `/auth/callback` und von dort zurück
   in die App geleitet – du bist eingeloggt.
