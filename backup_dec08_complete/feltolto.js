// Profilkép feltöltő szkript Supabase Storage-ba
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase beállítások
const supabaseUrl = 'https://xgvubkbfhleeagdvkhds.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndnVia2JmaGxlZWFnZHZraGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDAyNjcsImV4cCI6MjA3OTU3NjI2N30.AjaIcxqS73kUDDOWTwHofp2XcxnGbRIVGXLaI6Sdboc';
const supabase = createClient(supabaseUrl, supabaseKey);

// Képek mappája
const KEPEK_MAPPAA = path.join(__dirname, 'kepek');

async function kepekFeltoltese() {
  try {
    // Ellenőrizzük, hogy létezik-e a képek mappája
    if (!fs.existsSync(KEPEK_MAPPAA)) {
      console.error('❌ Hiba: A "kepek" mappa nem található!');
      console.log('Kérlek hozz létre egy "kepek" mappát a projekt gyökerében, és tedd bele a feltöltendő képeket.');
      return;
    }

    // Képek beolvasása a mappából
    const kepek = fs.readdirSync(KEPEK_MAPPAA)
      .filter(fajl => fajl.match(/\.(jpg|jpeg|png|gif)$/i));

    if (kepek.length === 0) {
      console.log('❌ Nincsenek képek a "kepek" mappában!');
      console.log('Kérlek adj hozzá néhány képet (jpg, jpeg, png, gif) a mappához.');
      return;
    }

    console.log(`✅ ${kepek.length} kép található a feltöltéshez.\n`);

    // Képek feltöltése egyesével
    for (const kepFajl of kepek) {
      const kepUtja = path.join(KEPEK_MAPPAA, kepFajl);
      const kepTartalma = fs.readFileSync(kepUtja);
      
      console.log(`📤 Feltöltés folyamatban: ${kepFajl}...`);

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(`public/${kepFajl}`, kepTartalma, {
          cacheControl: '3600',
          upsert: true,
          contentType: `image/${path.extname(kepFajl).substring(1)}`
        });

      if (error) {
        console.error(`❌ Hiba a(z) ${kepFajl} feltöltésekor:`, error.message);
      } else {
        console.log(`✅ Sikeresen feltöltve: ${kepFajl}`);
        console.log(`   Elérési út: ${supabaseUrl}/storage/v1/object/public/avatars/public/${kepFajl}\n`);
      }
    }

    console.log('🎉 A feltöltés befejeződött!\n');
    console.log('Következő lépések:');
    console.log('1. Látogass el a Supabase irányítópultodra');
    console.log('2. Nyisd meg a "Storage" részt');
    console.log('3. Kattints az "avatars" bucketre');
    console.log('4. Ellenőrizd a feltöltött képeket');
    console.log('5. Frissítsd a "profile_picture" mezőket a "profiles" táblában a megfelelő fájlnevekkel');

  } catch (hiba) {
    console.error('❌ Hiba történt a feltöltés során:', hiba.message);
  }
}

// Futtatás
kepekFeltoltese();
