/*
 * Copyright MADE/YOUR/DAY OG <mail@madeyourday.net>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Rst.SliderNav Class
 */
Rst.SliderNav = (function() {

	/**
	 * Rst.SliderNav Constructor
	 * @param Rst.Slider slider slider instance
	 */
	function SliderNav(slider) {

		var self = this;

		this.slider = slider;
		this.elements = {};

		if (slider.options.controls) {

			this.elements.prev = $(document.createElement('a'))
				.attr('href', '')
				.text('prev')
				.addClass(slider.options.cssPrefix + 'prev')
				.on('click', function(event){
					event.preventDefault();
					self.slider.prev();
				});

			this.elements.next = $(document.createElement('a'))
				.attr('href', '')
				.text('next')
				.on('click', function(event){
					event.preventDefault();
					self.slider.next();
				})
				.addClass(slider.options.cssPrefix + 'next');

			slider.elements.view
				.append(this.elements.prev)
				.append(this.elements.next);

		}

		if (slider.options.navType !== 'none') {

			this.elements.main = $(document.createElement('div'))
				.addClass(
					slider.options.cssPrefix + 'nav ' +
					slider.options.cssPrefix + 'nav-' + slider.options.navType
				);

			if (slider.options.navType === 'thumbs') {
				this.elements.thumbs = $(document.createElement('div'));
				$.each(this.slider.getSlides(), function(i, slide){
					self.createThumb(i, slide).appendTo(self.elements.thumbs);
				});
				this.elements.main.append(this.elements.thumbs);

				slider.elements.main.append(this.elements.main);

				this.thumbsSlider = new Rst.Slider(
					this.elements.thumbs,
					$.extend({
						// Inherit options:
						visibleArea: slider.options.visibleArea,
						visibleAreaMax: slider.options.visibleAreaMax,
						loop: slider.options.loop,
						duration: slider.options.duration,
						controls: slider.options.controls
					}, slider.options.thumbs || {})
				);
				this.setActive([0]);

			}
			else {

				this.elements.mainPrev = $(document.createElement('a'))
					.attr('href', '')
					.text('prev')
					.on('click', function(event){
						event.preventDefault();
						self.slider.prev();
					})
					.appendTo(
						$(document.createElement('li'))
							.addClass(slider.options.cssPrefix + 'nav-prev')
					);

				this.elements.mainNext = $(document.createElement('a'))
					.attr('href', '')
					.text('next')
					.on('click', function(event){
						event.preventDefault();
						self.slider.next();
					})
					.appendTo(
						$(document.createElement('li'))
							.addClass(slider.options.cssPrefix + 'nav-next')
					);

				var navUl = document.createElement('ul');
				$.each(this.slider.getSlides(), function(i, slide){
					self.elements[i] = self.createNavItem(i, slide.getData())
						.appendTo(navUl);
				});

				this.elements.mainPrev.parent().prependTo(navUl);
				this.elements.mainNext.parent().appendTo(navUl);

				this.elements.main.append(navUl);

				slider.elements.main.append(this.elements.main);

			}

		}

	}

	/**
	 * set active nav elements
	 */
	SliderNav.prototype.setActive = function(indexes) {

		var self = this;
		var slides = this.slider.getSlides();

		if (this.slider.options.navType === 'thumbs') {

			var visibleCount = this.thumbsSlider.getVisibleCount();
			var rowsCount = this.thumbsSlider.getVisibleRowsCount();
			var goTo = indexes[Math.floor((indexes.length - 1) / 2)] - Math.floor(
				(visibleCount - 1) / 2
			);

			if (!this.thumbsSlider.options.loop) {
				goTo = Math.min(
					this.thumbsSlider.slides.length - visibleCount,
					Math.max(0, goTo)
				);
			}
			else {
				goTo = this.thumbsSlider.getSlideIndex(goTo);
				goTo = this.getNearestIndex(
					goTo,
					this.thumbsSlider.slideIndex,
					this.thumbsSlider.getSlides().length
				);
			}

			goTo -= (((
				(goTo + Math.floor(rowsCount / 2) - this.thumbsSlider.slideIndex)
			% rowsCount) + rowsCount) % rowsCount) - Math.floor(rowsCount / 2);

			$.each(this.activeIndexes || [], function(i, index) {
				self.thumbsSlider.getSlide(index).element.removeClass(
					self.thumbsSlider.options.cssPrefix + 'active-thumb'
				);
			});
			$.each(indexes, function(i, index) {
				self.thumbsSlider.getSlide(index).element.addClass(
					self.thumbsSlider.options.cssPrefix + 'active-thumb'
				);
			});

			this.thumbsSlider.resize();
			this.thumbsSlider.goTo(goTo);

		}

		if (this.activeIndexes) {
			$.each(this.activeIndexes, function(i, index) {
				if (!self.elements[index]) {
					return;
				}
				self.elements[index].children('a').removeClass('active');
			});
		}

		if (
			this.elements[slides.length]
			&& $.inArray(slides.length - 1, indexes) !== -1
		) {
			indexes = [slides.length];
		}

		this.activeIndexes = indexes;

		var visibleActive = false;
		$.each(this.activeIndexes, function(i, index) {
			if (!self.elements[index]) {
				return;
			}
			if (self.elements[index][0].style.display !== 'none') {
				visibleActive = true;
			}
			self.elements[index].children('a').addClass('active');
		});

		// No visible item is active so we activate the last one
		if (!visibleActive && this.elements[slides.length]) {
			$.each(this.activeIndexes, function(i, index) {
				if (!self.elements[index]) {
					return;
				}
				self.elements[index].children('a').removeClass('active');
			});
			this.activeIndexes = [slides.length];
			this.elements[slides.length].children('a').addClass('active');
		}

	};

	/**
	 * get nearest index, return value may overflow negative or positive
	 */
	SliderNav.prototype.getNearestIndex = function(goTo, index, length) {
		if (Math.abs(goTo - index) > Math.abs(goTo - length - index)) {
			goTo -= length;
		}
		else if (Math.abs(goTo - index) > Math.abs(goTo + length - index)) {
			goTo += length;
		}
		return goTo;
	};

	/**
	 * combine navigation items
	 */
	SliderNav.prototype.combineItems = function() {

		if (!this.elements[0]) {
			return;
		}

		var visibleCount = this.slider.getVisibleCount();
		var slides = this.slider.getSlides();

		if (this.elements[slides.length]) {
			this.elements[slides.length].remove();
			delete this.elements[slides.length];
		}

		$.each(this.elements, function() {
			this.css('display', '');
		});

		if (visibleCount < 2 || !this.slider.options.combineNavItems) {
			return;
		}

		var lastIndex;
		for (var i = 0; this.elements[i]; i++) {
			if (
				(i - Math.floor((visibleCount - 1) / 2)) % visibleCount
				|| (i - Math.floor((visibleCount - 1) / 2)) > slides.length - visibleCount
			) {
				this.elements[i].css('display', 'none');
			}
			else {
				lastIndex = i;
			}
		}

		if (slides.length % visibleCount === 0) {
			this.elements[
				slides.length - visibleCount
				+ Math.floor((visibleCount - 1) / 2)
			].css('display', '');
		}
		else {
			var newIndex = slides.length
				- (slides.length % visibleCount || visibleCount)
				+ Math.floor((visibleCount - 1) / 2);
			this.elements[slides.length] = this.createNavItem(
				newIndex,
				slides[newIndex >= slides.length ? slides.length - 1 : newIndex].getData()
			).insertAfter(this.elements[slides.length - 1]);
		}

	};

	/**
	 * show navigation
	 */
	SliderNav.prototype.show = function() {

		$([])
			.add(this.elements.prev)
			.add(this.elements.next)
			.add(this.elements.main)
			.css('display', '');

	};

	/**
	 * hide navigation
	 */
	SliderNav.prototype.hide = function() {

		$([])
			.add(this.elements.prev)
			.add(this.elements.next)
			.add(this.elements.main)
			.css('display', 'none');

	};

	/**
	 * set
	 * @return jQuery element
	 */
	SliderNav.prototype.createNavItem = function(index, data) {

		var self = this;

		return $(document.createElement('li'))
			.addClass(self.slider.options.cssPrefix + 'nav-item')
			.append($(document.createElement('a'))
				.attr('href', '')
				.text((self.slider.options.navType !== 'numbers' && data.name) ?
					data.name :
					(data.index + 1)
				)
				.on('click', function(event){
					event.preventDefault();
					self.itemOnClick(index);
				})
			);

	};

	/**
	 * set
	 * @return jQuery element
	 */
	SliderNav.prototype.createThumb = function(index, slide) {

		var self = this;

		return $(document.createElement('a'))
			.attr('href', '')
			.attr('data-rsts-type', 'image')
			.append($(document.createElement('img'))
				.attr('src', slide.getThumbUrl())
				.attr('alt', slide.getData().name)
			)
			.on('click', function(event){
				event.preventDefault();
				self.itemOnClick(index);
			});

	};

	/**
	 * navigation item onclick handler
	 */
	SliderNav.prototype.itemOnClick = function(index) {

		var visibleCount = this.slider.getVisibleCount();
		var rowsCount = this.slider.getVisibleRowsCount();
		var goTo = index - Math.floor(
			(visibleCount - 1) / 2
		);

		if (!this.slider.options.loop) {
			goTo = Math.min(
				this.slider.slides.length - visibleCount,
				Math.max(0, goTo)
			);
		}
		else {
			goTo = this.getNearestIndex(
				this.slider.getSlideIndex(goTo),
				this.slider.slideIndex,
				this.slider.getSlides().length
			);
		}

		goTo -= (((
			(goTo + Math.floor(rowsCount / 2) - this.slider.slideIndex)
		% rowsCount) + rowsCount) % rowsCount) - Math.floor(rowsCount / 2);

		this.slider.goTo(goTo);

	};

	/**
	 * resize the navigation
	 */
	SliderNav.prototype.resize = function() {

		if (this.thumbsSlider) {
			this.thumbsSlider.resize();
		}

	};

	/**
	 * get size
	 * @return object {x: ..., y: ...}
	 */
	SliderNav.prototype.getSize = function() {

		if (
			!this.elements.main
			|| this.elements.main.css('position') === 'absolute'
		) {
			return {x: 0, y: 0};
		}

		return {
			x: this.elements.main.outerWidth(true),
			y: this.elements.main.outerHeight(true)
		};

	};

	return SliderNav;
})();
