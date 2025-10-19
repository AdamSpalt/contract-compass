// place files you want to import through the `$lib` alias in this folder.
// c:\Projects\contract-compass\supabase\functions\email-reminder\index.ts

// This code will correctly read the variables automatically provided by Supabase.
const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    //...
);

// This will correctly read the secret you just set.
const resend = new Resend(Deno.env.get('RESEND_API_KEY')!);
