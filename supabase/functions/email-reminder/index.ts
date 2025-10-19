import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { Resend } from 'npm:resend@3.2.0';

// --- Configuration ---
// IMPORTANT: Replace with your actual email address.
const TO_EMAIL = 'adam.spaltenstein@gmail.com';
const FROM_EMAIL = 'onboarding@resend.dev'; // This must be a verified domain in your Resend account.
const APP_URL = 'https://contract-compass-eight.vercel.app'; // IMPORTANT: Replace with your actual app URL.

const EMAIL_SUBJECT_TEMPLATE = 'Contract Renewal/Ending Reminder: {contract_name}';
const EMAIL_BODY_TEMPLATE = `
  <p>Hi,</p>
  <p>This is a reminder that your contract, <strong>{contract_name}</strong>, is due for ending/renewal soon.</p>
  <p><strong>End Date:</strong> {end_date}</p>
  <p>You can view the contract details by clicking the button below:</p>
  <p><a href="{app_url}/contracts/{contract_id}" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: white; background-color: #007bff; text-decoration: none; border-radius: 5px;">View Contract Details</a></p>
  <br>
  <p>Thanks,</p>
  <p>The Contract Compass Team</p>
`;
// --- End Configuration ---

// Define the shape of a contract from our database
interface Contract {
	id: string;
	contract_name: string;
	end_date: string;
	thirty_day_reminder_sent: boolean;
	fourteen_day_reminder_sent: boolean;
	seven_day_reminder_sent: boolean;
}

Deno.serve(async (req) => {
	try {
		// --- Environment Variable Validation ---
		const supabaseUrl = Deno.env.get('SUPABASE_URL');
		const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
		const resendApiKey = Deno.env.get('RESEND_API_KEY');

		if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
			console.error('Missing required environment variables.');
			return new Response(JSON.stringify({ error: 'Missing required environment variables.' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Create a Supabase client with the service_role key
		const supabaseClient = createClient(
			supabaseUrl,
			serviceRoleKey,
			{
				auth: {
					persistSession: false
				}
			}
		);

		// Initialize Resend client
		const resend = new Resend(resendApiKey);

		// Get today's date (at midnight) for accurate day comparison
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Define reminder intervals and their corresponding flag columns
		const reminderIntervals = [
			{ days: 30, flag: 'thirty_day_reminder_sent' as const },
			{ days: 14, flag: 'fourteen_day_reminder_sent' as const },
			{ days: 7, flag: 'seven_day_reminder_sent' as const }
		];

		const allErrors: string[] = [];
		const sentEmails: string[] = [];

		// Process each reminder interval
		for (const interval of reminderIntervals) {
			const targetDate = new Date(today);
			targetDate.setDate(today.getDate() + interval.days);

			// Format targetDate to 'YYYY-MM-DD' for the query
			const targetDateString = targetDate.toISOString().split('T')[0];

			// Query for contracts that are due for a reminder
			const { data: contracts, error: queryError } = await supabaseClient
				.from('contracts')
				.select('*')
				.eq('end_date', targetDateString)
				.eq(interval.flag, false)
				.returns<Contract[]>();

			if (queryError) {
				console.error(`Error querying for ${interval.days}-day reminders:`, queryError.message);
				allErrors.push(`Query failed for ${interval.days}-day reminders.`);
				continue; // Move to the next interval
			}

			if (!contracts || contracts.length === 0) {
				console.log(`No contracts found for ${interval.days}-day reminder.`);
				continue;
			}

			// Create all email sending promises
			const emailPromises = contracts.map(async (contract) => {
				const subject = EMAIL_SUBJECT_TEMPLATE.replace('{contract_name}', contract.contract_name);
				const body = EMAIL_BODY_TEMPLATE.replace('{contract_name}', contract.contract_name)
					.replace('{end_date}', contract.end_date)
					.replace('{app_url}', APP_URL)
					.replace('{contract_id}', contract.id);

				const { data, error: emailError } = await resend.emails.send({
					from: FROM_EMAIL,
					to: TO_EMAIL,
					subject: subject,
					html: body
				});

				return { contract, emailError };
			});

			// Wait for all emails to be sent
			const emailResults = await Promise.all(emailPromises);

			// Process results and update database flags
			for (const { contract, emailError } of emailResults) {
				if (emailError) {
					console.error(`Failed to send email for contract ${contract.id}:`, emailError);
					allErrors.push(`Email failed for contract ${contract.id}.`);
					continue; // Skip updating the flag if email sending failed
				}

				sentEmails.push(`Sent ${interval.days}-day reminder for ${contract.contract_name}`);

				// Update the flag in the database to prevent re-sending
				const { error: updateError } = await supabaseClient
					.from('contracts')
					.update({ [interval.flag]: true })
					.eq('id', contract.id);
				
				if (updateError) {
					console.error(`Failed to update flag for contract ${contract.id}:`, updateError.message);
					allErrors.push(`DB update failed for contract ${contract.id}.`);
				}
			}
		}

		return new Response(JSON.stringify({ sent: sentEmails, errors: allErrors }), {
			headers: { 'Content-Type': 'application/json' },
			status: allErrors.length > 0 ? 500 : 200
		});
	} catch (e) {
		console.error(e);
		return new Response(JSON.stringify({ error: 'Function failed unexpectedly.' }), {
			headers: { 'Content-Type': 'application/json' },
			status: 500
		});
	}
});
