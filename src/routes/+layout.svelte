<script>
	import '../app.css';
	import { page } from '$app/stores';
</script>

<header>
	<nav>
		<a href="/" class="logo">Contract Compass</a>
		<div class="nav-links">
			<a href="/" class:active={$page.url.pathname === '/'}>Dashboard</a>
			<a href="/analysis" class:active={$page.url.pathname === '/analysis'}>Insights</a>
		</div>
	</nav>
</header>

<div class="main-content">
	<slot />
</div>

<style>
	header {
		background-color: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
		padding: 0 2rem;
		box-shadow: var(--box-shadow);
	}
	nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		max-width: 1200px;
		margin: 0 auto;
		height: 60px;
	}
	.logo {
		font-weight: 700;
		font-size: 1.25rem;
		color: var(--color-text-primary);
		text-decoration: none;
	}
	.nav-links {
		display: flex;
		gap: 1.5rem;
	}
	.nav-links a {
		text-decoration: none;
		color: var(--color-text-secondary);
		font-weight: 500;
		padding: 0.5rem 0;
		border-bottom: 2px solid transparent;
		transition: color 0.2s, border-color 0.2s;
	}
	.nav-links a:hover {
		color: var(--color-primary);
	}
	.nav-links a.active {
		color: var(--color-primary);
		border-bottom-color: var(--color-primary);
	}
	.main-content {
		/* padding-top is handled by individual page margins */
	}
</style>