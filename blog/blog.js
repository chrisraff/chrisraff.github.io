var Blog = (function () {
	var postsPromise = null;

	function fetchPosts() {
		if (!postsPromise) {
			postsPromise = fetch('/blog/posts.json')
				.then(function (res) { return res.json(); })
				.catch(function () { return []; });
		}
		return postsPromise;
	}

	function formatDate(iso) {
		var d = new Date(iso);
		return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
	}

	var activeTag = null;
	var renderers = [];

	function applyFilter() {
		renderers.forEach(function (draw) { draw(); });
	}

	function setActiveTag(tag) {
		activeTag = (activeTag === tag) ? null : tag;
		applyFilter();
	}

	function filterPosts(posts) {
		if (!activeTag) return posts;
		return posts.filter(function (post) {
			return (post.tags || []).indexOf(activeTag) !== -1;
		});
	}

	function buildTagPills(posts, container) {
		var tags = [];
		posts.forEach(function (post) {
			(post.tags || []).forEach(function (tag) {
				if (tags.indexOf(tag) === -1) tags.push(tag);
			});
		});
		if (tags.length === 0) return;
		tags.sort();

		var wrap = document.createElement('div');
		wrap.className = 'tag-filter';
		tags.forEach(function (tag) {
			var pill = document.createElement('span');
			pill.className = 'tag-pill' + (activeTag === tag ? ' active' : '');
			pill.textContent = tag;
			pill.addEventListener('click', function () { setActiveTag(tag); });
			wrap.appendChild(pill);
		});
		container.appendChild(wrap);
	}

	function initSidebarToggle(toggle, content) {
		if (!toggle || !content) return;
		toggle.addEventListener('click', function () {
			var isOpen = content.classList.toggle('open');
			toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
		});
	}

	function renderSidebar(selector) {
		var container = document.querySelector(selector);
		if (!container) return;

		initSidebarToggle(document.getElementById('blog-sidebar-toggle'), container);

		function draw() {
			fetchPosts().then(function (posts) {
				container.innerHTML = '';

				if (posts.length === 0) {
					container.textContent = 'No posts yet.';
					return;
				}

				buildTagPills(posts, container);

				var list = document.createElement('ul');
				list.className = 'sidebar-post-list';
				filterPosts(posts).forEach(function (post) {
					var li = document.createElement('li');

					var a = document.createElement('a');
					a.href = post.url;
					a.textContent = post.title;

					var date = document.createElement('div');
					date.className = 'sidebar-post-date';
					date.textContent = formatDate(post.date);

					li.appendChild(a);
					li.appendChild(date);
					list.appendChild(li);
				});
				container.appendChild(list);
			});
		}

		renderers.push(draw);
		draw();
	}

	function renderArchive(selector) {
		var container = document.querySelector(selector);
		if (!container) return;

		function draw() {
			fetchPosts().then(function (posts) {
				container.innerHTML = '';

				if (posts.length === 0) {
					container.textContent = 'No posts yet.';
					return;
				}

				var filtered = filterPosts(posts);
				if (filtered.length === 0) {
					container.textContent = 'No posts with this tag.';
					return;
				}

				filtered.forEach(function (post) {
					var entry = document.createElement('div');
					entry.className = 'archive-entry';

					var title = document.createElement('h3');
					var a = document.createElement('a');
					a.href = post.url;
					a.textContent = post.title;
					title.appendChild(a);

					var date = document.createElement('div');
					date.className = 'archive-post-date';
					date.textContent = formatDate(post.date);

					var excerpt = document.createElement('p');
					excerpt.textContent = post.excerpt;

					entry.appendChild(title);
					entry.appendChild(date);
					entry.appendChild(excerpt);
					container.appendChild(entry);
				});
			});
		}

		renderers.push(draw);
		draw();
	}

	function renderHomeTeaser(selector, count) {
		count = count || 3;
		var container = document.querySelector(selector);
		if (!container) return;

		fetchPosts().then(function (posts) {
			container.innerHTML = '';
			if (posts.length === 0) return;

			var list = document.createElement('div');
			list.className = 'post-teaser-list';
			posts.slice(0, count).forEach(function (post) {
				var entry = document.createElement('a');
				entry.className = 'post-teaser';
				entry.href = post.url;

				if (post.image) {
					var thumb = document.createElement('img');
					thumb.className = 'post-teaser-thumb';
					thumb.src = post.image;
					thumb.alt = '';
					entry.appendChild(thumb);
				}

				var text = document.createElement('div');
				text.className = 'post-teaser-text';

				var date = document.createElement('span');
				date.className = 'post-teaser-date';
				date.textContent = formatDate(post.date);

				var title = document.createElement('span');
				title.className = 'post-teaser-title';
				title.textContent = post.title;

				text.appendChild(date);
				text.appendChild(title);
				entry.appendChild(text);
				list.appendChild(entry);
			});
			container.appendChild(list);

			var viewAll = document.createElement('a');
			viewAll.href = '/blog/';
			viewAll.className = 'view-all-posts';
			viewAll.textContent = 'View all posts →';
			container.appendChild(viewAll);
		});
	}

	return {
		renderSidebar: renderSidebar,
		renderArchive: renderArchive,
		renderHomeTeaser: renderHomeTeaser
	};
})();
