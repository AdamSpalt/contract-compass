<!--
  This file serves as the root layout for the entire application.
  It defines the main navigation header that is shared across all pages,
  providing consistent links to the "Dashboard" and "Analysis" sections.
  The `<slot />` component renders the content of the current page.
-->
<script>
	import { page } from '$app/stores';
	import '../app.css';
</script>

<header>
	<div class="header-inner">
		<div class="logo">
			<a href="/">Contract Compass</a>
		</div>
		<nav>
			<a href="/" class:active={$page.url.pathname === '/'}>Dashboard</a>
			<a href="/analysis" class:active={$page.url.pathname.startsWith('/analysis')}>Insights</a>
		</nav>
	</div>
</header>

<slot />

<style>
	header {
		display: flex;
		background-color: #e9ecef;
		padding: 0 2rem;
		border-bottom: 1px solid #e0e0e0;
		font-family: sans-serif;
	}

	.header-inner {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem 0;
	}

	.logo a {
		font-size: 1.5rem;
		font-weight: 700;
		color: #333;
		text-decoration: none;
	}

	nav {
		display: flex;
		gap: 1.5rem;
	}

	nav a {
		color: #555;
		text-decoration: none;
		font-weight: 500;
		padding: 0.5rem 1rem;
		border-radius: 9999px; /* Creates the pill shape */
		transition:
			color 0.2s,
			background-color 0.2s;
	}

	nav a:hover {
		color: #005a9e;
		background-color: #f0f5fa; /* Light blue background on hover */
	}

	nav a.active {
		color: #005a9e; /* Darker blue text for active link */
		background-color: #e0eefc; /* A slightly darker blue for the pill */
		font-weight: 600;
	}
</style>