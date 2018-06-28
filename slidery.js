(function(){

    class Slidery {

        constructor(container, config){
            this.config = {
                images: [],
                mode: 'slide',
                interval: 5000,
                speed: 0.5,
                color: '#fff',
                zIndex: null,
                showIndicator: true,
            }


            if (!container)
                throw new SyntaxError('Slidery: No container is specified.');

            if (!config)
                throw new SyntaxError('Slidery: No image is passed.');


            if (Array.isArray(config))
                this.config.images = config;
            else if (config.constructor === Object)
                for (const key in config)
                    this.config[key] = config[key];
            else
                throw new TypeError('Argument "config" must be either an array of image urls or a config object.');


            if (typeof this.config.interval !== 'number')
                throw new TypeError('Property "interval" must be typeof number.');

            if (this.config.interval <= 0 || !isFinite(this.config.interval))
                throw new RangeError('Property "interval" must be a finite positive number.');

            if (typeof this.config.speed !== 'number')
                throw new TypeError('Property "speed" must be typeof number.');

            if (this.config.speed <= 0 || this.config.speed > 1 || !isFinite(this.config.speed))
                throw new RangeError('Property "speed" must be between 0 to 1.');


            if (typeof container === 'string')
                this.container = document.querySelector(container);
            else
                this.container = container;

            if (!this.container || !/HTML\w{1,}Element/.test(this.container.constructor.toString()))
                throw new TypeError('Property "container" must be a DOM element.');


            this.images = [];
            this.indicator = {
                arrows: {
                    container: null,
                    left: null,
                    right: null,
                    options: {
                        size: 30,
                        width: 50
                    }
                },
                dots: {
                    container: null,
                    dots: [],
                    options: {
                        size: 10,
                        margin: 5
                    }
                }
            };

            this.rect = this.container.getBoundingClientRect();
            this.fragment = document.createDocumentFragment();

            this.init();
        }

        init(){
            this.createImages();

            if (this.config.showIndicator !== false){
                this.createArrows();
                this.createDots();
            }

            setTimeout(() => {
                switch (this.config.mode){
                    case 'slide': this.slide(); break;
                    case 'fade': this.fade(); break;
                    default: this.slide();
                }
            }, this.config.interval);

            // So that images in queue are not shown
            this.container.style.overflow = 'hidden';

            // Use documentFragment so that only one repaint is needed
            this.container.appendChild(this.fragment);

            window.addEventListener('resize', this.resize.bind(this));
        }

        css(elem, prop, value){
            if (typeof prop === 'string')
                elem.style[prop] = value;
            else
                for (const p in prop)
                    elem.style[p] = prop[p];
        }

        resize(){
            this.rect = this.container.getBoundingClientRect();

            // To resize images
            const len = this.images.length;
            for (let i = 0; i < len; i++){
                this.css(this.images[i], {
                    width: `${this.rect.width}px`,
                    height: `${this.rect.height}px`
                });
            }

            if (this.config.showIndicator === true){

                const dotIndicator = this.indicator.dots;
                const arrowIndicator = this.indicator.arrows;

                // To center align dots container
                const dotContainerWidth = (dotIndicator.options.size + dotIndicator.options.margin*2)*this.images.length;
                const dotContainerLeft = (this.rect.width - dotContainerWidth)*0.5 + 'px'
                this.css(dotIndicator.container, 'left', dotContainerLeft);

                // To realign arrow container height
                const arrowContainerHeight = `${this.rect.height}px`;
                this.css(arrowIndicator.container.left, {
                    left: '0',
                    height: arrowContainerHeight
                });
                this.css(arrowIndicator.container.right, {
                    right: '0',
                    height: arrowContainerHeight
                });

                // To verticle align middle arrows
                const arrowTop = (this.rect.height - arrowIndicator.options.size)*0.5 + 'px';
                this.css(arrowIndicator.left, 'top', arrowTop);
                this.css(arrowIndicator.right, 'top', arrowTop);

            }
        }

        createImages(){
            // So that images within container can use position absolute.
            if (window.getComputedStyle(this.container).position === 'static')
                this.container.style.position = 'relative';

            const len = this.config.images.length;
            const zIndex = this.config.zIndex || len;
            for (let i = 0; i < len; i++){

                const image = document.createElement('div');

                this.css(image, {
                    backgroundImage: `url('${this.config.images[i]}')`,
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center center',
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    zIndex: zIndex,
                    width: `${this.rect.width}px`,
                    height: `${this.rect.height}px`
                });

                if (this.config.mode === 'fade')
                    this.css(image, 'opacity', i === 0 ? 1 : '0');
                else
                    this.css(image, 'left', i === 0 ? i : '100%');

                this.fragment.appendChild(image);
                this.images[i] = image;

            }
        }

        createArrows(){
            const size = this.indicator.arrows.options.size;
            const width = this.indicator.arrows.options.width;

            const arrow = {
                left: document.createElement('div'),
                right: document.createElement('div'),
                style: (elem, extraProp, extraValue) => {
                    const factor = size*(0.24*0.025);

                    this.css(elem, {
                        position: 'absolute',
                        top: `${(this.rect.height - size)*0.5 - factor}px`,
                        height: `${size}px`,
                        width: `${size}px`,
                        fontSize: `${size}px`,
                        lineHeight: '1',
                        textAlign: 'center',
                        zIndex: 'inherit',
                        color: this.config.color,
                        cursor: 'pointer',
                        userSelect: 'none'
                    });

                    if (extraProp && extraValue)
                        this.css(elem, extraProp, extraValue);
                }
            }

            const subContainer = {
                left: document.createElement('div'),
                right: document.createElement('div'),
                style: (area, extraProp, extraValue) => {
                    this.css(area, {
                        position: 'absolute',
                        top: '0',
                        height: `${this.rect.height}px`,
                        width: `${width}px`,
                        zIndex: (this.config.zIndex || this.images.length) + 1,
                        cursor: 'pointer',
                    });

                    if (extraProp && extraValue)
                        area.style[extraProp] = extraValue;
                }
            }

            // To center arrow within its subContainer
            const position = `${(width - size)*0.5}px`;
            arrow.style(arrow.left, 'left', position);
            arrow.style(arrow.right, 'right', position);
            arrow.left.innerHTML = '&#10094;';
            arrow.right.innerHTML = '&#10095;';

            subContainer.style(subContainer.left, 'left', '0');
            subContainer.style(subContainer.right, 'right', '0');

            subContainer.left.appendChild(arrow.left);
            subContainer.right.appendChild(arrow.right);

            this.indicator.arrows.container = subContainer;
            this.indicator.arrows.left = arrow.left;
            this.indicator.arrows.right = arrow.right;

            this.fragment.appendChild(subContainer.left);
            this.fragment.appendChild(subContainer.right);
        }

        createDots(){
            const size = this.indicator.dots.options.size;
            const margin = this.indicator.dots.options.margin;
            const subContainer = document.createElement('div');
            const len = this.images.length;

            for (let i = 0; i < len; i++){
                const dot = document.createElement('div');
                this.css(dot, {
                    width: `${size}px`,
                    height: `${size}px`,
                    margin: `0 ${margin}px`,
                    cursor: 'pointer',
                    float: 'left',
                    backgroundColor: this.config.color,
                    boxSizing: 'border-box',
                    borderRadius: '50%'
                });
                subContainer.appendChild(dot);
                this.indicator.dots.dots.push(dot);
            }

            const totalWidth = (size + margin*2)*len;

            this.css(subContainer, {
                position: 'absolute',
                bottom: `${size}px`,
                left: (this.rect.width - totalWidth)*0.5 + 'px', // Center the subContainer
                height: `${size}px`,
                width: totalWidth + 'px',
                zIndex: (this.config.zIndex || len) + 1
            });

            this.indicator.dots.container = subContainer;
            this.fragment.appendChild(subContainer);
        }

        slide(){
            let current, next, progress, interval,
                index = 0;

            const images = this.images;
            const len = images.length;
            const speed = this.config.speed;
            const zIndex = this.config.zIndex || len;

            return animate.call(this);

            function animate(){
                current = images[index];
                next = images[index + 1] || images[0];
                progress = 0;

                this.css(current, 'zIndex', zIndex);
                this.css(next, 'zIndex', zIndex);

                interval = setInterval(moveFrame.bind(this), 5);
            }

            function moveFrame(){
                const p = progress + speed;

                // Max progress = 100
                progress = p < 100 ? p : 100;
                const directionalProgress = -1*(this.easeInOut(progress/100)*100);
                const moveBy = `${100 + directionalProgress}%`;

                this.css(current, 'left', `${directionalProgress}%`);
                this.css(next, 'left', moveBy);

                if (progress >= 100)
                    stopAnimation.call(this);
            }

            function stopAnimation(){
                clearInterval(interval);

                if (index < len - 1)
                    index += 1;
                else
                    index = 0;

                this.css(current, 'left', `100%`);
                this.css(current, {
                    left: '100%',
                    zIndex: '-1'
                })

                setTimeout(animate.bind(this), this.config.interval);
            }
        }

        fade(){
            let current, next, prev, progress, interval,
                index = 0;

            const images = this.images;
            const len = images.length;
            const speed = this.config.speed;
            const zIndex = this.config.zIndex || len;

            return animate.call(this);

            function animate(){
                current = images[index];
                next = images[index + 1] || images[0];
                progress = 0;

                this.css(current, 'zIndex', zIndex - 1);
                this.css(next, 'zIndex', zIndex);

                interval = setInterval(moveFrame.bind(this), 5);
            }

            function moveFrame(){
                const p = progress + (speed/100);

                // Max progress = 1
                progress = p < 1 ? p : 1;

                this.css(next, 'opacity', progress);
                //this.css(current, 'opacity', 1 - progress);

                if (progress >= 1)
                    stopAnimation.call(this);
            }

            function stopAnimation(){
                clearInterval(interval);

                if (index < len - 1)
                    index += 1;
                else
                    index = 0;

                this.css(current, {
                    zIndex: zIndex - 2,
                    opacity: '0'
                })

                setTimeout(animate.bind(this), this.config.interval);
            }
        }

        easeInOut(t){
            return t < 0.5
                ? 8*Math.pow(t, 4)
                : 1 - 8*(--t)*Math.pow(t, 3);
        }

    }


    window.Slidery = Slidery;

})();