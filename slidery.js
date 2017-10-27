(function(){

    'use strict';
    
    var css = function(elem, style, value){
        var prop;
        if (typeof style === 'string')
            elem.style[style] = value;
        else
            for (prop in style)
                elem.style[prop] = style[prop];
    }

    var Slidery = function(custom){

        var err = '',
            war = '',
            error = function(text){
                err += (err === '' ? '' : '\n') + text;
            },
            warning = function(text){
                war += (war === '' ? '' : '\n') + text;
            };

        this.defaults = {
            images: [],
            container: document.body,
            imageSize: 'cover',
            imageRepeat: 'no-repeat',
            imagePosition: 'center center',
            interval: 5000,
            speed: 2,
            spf: 7.5,
            mode: 'slide',
            zIndex: 0,
            draggable: true,
            gap: true,
            options: {
                slide: {
                    move: 'in',
                    stack: false,
                    direction: 'left',
                    opacity: 1,
                },
                fade: {
                    opacity: 1,
                },
                indicator: {
                    show: true,
                    hideOnIdle: true,
                    idleThreshold: 2000,
                    opacity: 0.5,
                    dot: {
                        show: true,
                        size: 10,
                        space: 10,
                        color: '#000',
                        type: 'round',
                    },
                    arrow: {
                        show: true,
                        area: 50,
                        size: 30,
                        color: '#000',
                        appearance: {
                            left: '&#10094;',
                            right: '&#10095;',
                        },
                    },
                },
            },
        };

        this.config = function extend(out){
            var i = 1,
                len = arguments.length,
                obj,
                key;
            out = out || {};
            for (; i < len; i++){
                obj = arguments[i];
                if (!obj) continue;
                for (key in obj)
                    if (obj.hasOwnProperty(key))
                        out[key] = obj[key].constructor === Object ? extend(out[key], obj[key]) : obj[key];
            }
            return out;
        }({}, this.defaults, custom);

        try {
            if (!/^(contain|initial|inherit|cover|((\d{1,}(px|em|rem|cm|mm|in|pt|pc|ex|ch|vh|vw|vmin|vmax|\u0025))|(\d{1,}(px|em|rem|cm|mm|in|pt|pc|ex|ch|vh|vw|vmin|vmax|\u0025)\s\d{1,}(px|em|rem|cm|mm|in|pt|pc|ex|ch|vh|vw|vmin|vmax|\u0025))))$/ig.test(this.config.imageSize))
                error('Property "imageSize" only supports value similar to CSS "background-size" property.');

            if (!/^(repeat|repeat-x|repeat-y|no-repeat|initial|inherit)$/ig.test(this.config.imageRepeat))
                error('Property "imageRepeat" only supports value similar to CSS "background-repeat" property.');

            if (!/^(initial|inherit|((left|top|center|bottom|right)|((left|top|center|bottom|right)\s(left|top|center|bottom|right)))|((\d{1,}(px|em|rem|cm|mm|in|pt|pc|ex|ch|vh|vw|vmin|vmax|\u0025))|(\d{1,}(px|em|rem|cm|mm|in|pt|pc|ex|ch|vh|vw|vmin|vmax|\u0025)\s\d{1,}(px|em|rem|cm|mm|in|pt|pc|ex|ch|vh|vw|vmin|vmax|\u0025))))$/ig.test(this.config.imagePosition))
                error('Property "imagePosition" only supports value similar to CSS "background-position" property.');

            if (typeof this.config.interval !== 'number')
                error('Value of property "interval" must be a number type.');

            if (this.config.interval < 0)
                error('Value of property "interval" must be a positive number to work properly.');

            if (typeof this.config.speed !== 'number')
                error('Value of property "speed" must be a number type.');

            if (this.config.speed < 0)
                error('Value of property "speed" must be a positive number to work.');

            if (typeof this.config.zIndex !== 'number')
                error('Value of property "zIndex" must be a number type.');

            if (this.config.zIndex < 0)
                warning('Negative base "zIndex" value is not recommended as it might unexpectedly hide your images behind body and window element.');

            if (!/^(slide|fade)$/ig.test(this.config.mode))
                error('Only two modes are available currently: "slide" and "fade".');

            if (this.config.mode == 'slide')
                if (this.config.options.slide.stack === true)
                    if (this.config.options.slide.opacity != 1)
                        warning('Property "options.slide.opacity" will not apply when "options.slide.stack" is set to "true".');

            if (!/^(in|out)$/ig.test(this.config.options.slide.move))
                error('Property "options.slide.move" only supports value "in" or "out".');

            if (typeof this.config.options.slide.stack !== 'boolean')
                error('Property "options.slide.stack" must be a boolean.');

            if (!/^(left|right|up|down)$/ig.test(this.config.options.slide.direction))
                error('Property "options.slide.direction" only accepts value: left, right, up, down.');

            if (isNaN(this.config.options.fade.opacity))
                error('Property "options.fade.opacity" accepts only number value.');

            if (this.config.options.fade.opacity < 1)
                if (this.config.options.fade.overlap === true)
                    warning('Slider might not work as intended when "options.fade.opacity" is less than 1 and "options.fade.overlap" is set to true.');

            if (war !== '')
                console.warn(war);
            if (err !== '')
                throw err;
        } catch(e){
            console.error(e);
            return;
        }

        this.container = this.config.container;
        this.fragment = document.createDocumentFragment();
        this.images = [];
        this.indicator = {};
        this.rect = this.container.getBoundingClientRect();

        this.container.style.overflow = 'hidden';

        this.init();

    }

    Slidery.prototype = {

        createImage: function(){
            var len = this.config.images.length,
                i = 0,
                image;

            if (window.getComputedStyle(this.container).position === 'static')
                this.container.style.position = 'relative';

            for (; i < len; i++){
                image = document.createElement('div');
                css(image, {
                    backgroundImage: 'url("' + this.config.images[i] + '")',
                    backgroundSize: this.config.imageSize,
                    backgroundRepeat: this.config.imageRepeat,
                    backgroundPosition: this.config.imagePosition,
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    zIndex: this.config.zIndex + ((len - 1) - i),
                    width: this.rect.width + 'px',
                    height: this.rect.height + 'px',
                });
                this.fragment.appendChild(image);
                this.images[i] = image;
            }

            this.container.appendChild(this.fragment);
        },

        createIndicator: function(){
            var len = this.images.length,
                i,
                size,
                margin,
                styling,
                width,
                arrow,
                dot,
                dots = [],
                container = {
                    arrow: undefined,
                    dot: undefined
                },
                indicator = this.config.options.indicator;

            var temp;

            if (indicator.dot.show === true){
                size = indicator.dot.size + 'px';
                margin = indicator.dot.space*0.5 + 'px';
                container.dot = document.createElement('div');

                for (i = 0; i < len; i++){
                    dot = document.createElement('div');
                    css(dot, {
                        width: size,
                        height: size,
                        margin: '0 ' + margin,
                        cursor: 'pointer',
                        float: 'left',
                        backgroundColor: indicator.dot.color,
                        opacity: indicator.opacity,
                        boxSizing: 'border-box',
                        borderRadius: indicator.dot.type === 'round' ? '50%' : '0'
                    });
                    container.dot.appendChild(dot);
                    dots[i] = dot;
                }

                width = (parseInt(size) + (parseInt(margin)*2))*len;

                css(container.dot, {
                    position: 'absolute',
                    bottom: size,
                    left: (this.rect.width - width)*0.5 + 'px',
                    height: size,
                    width: width + 'px',
                    zIndex: this.config.zIndex + 1 + len
                });
            }

            if (indicator.arrow.show === true){
                size = indicator.arrow.size + 'px';
                width = indicator.arrow.area + 'px';
                arrow = {
                    left: document.createElement('div'),
                    right: document.createElement('div'),
                    style: function(elem, extraProp, extraValue){
                        var factor = indicator.arrow.size*(0.24*0.025);
                        css(elem, {
                            position: 'absolute',
                            top: (((this.rect.height - parseInt(size))*0.5) - factor) + 'px',
                            height: size,
                            width: size,
                            fontSize: size,
                            zIndex: 'inherit',
                            opacity: indicator.opacity,
                            color: indicator.arrow.color,
                            cursor: 'pointer',
                        });
                        if (extraProp && extraValue)
                            elem.style[extraProp] = extraValue;
                    }.bind(this)
                };
                container.arrow = {
                    left: document.createElement('div'),
                    right: document.createElement('div'),
                    style: function(area, extraProp, extraValue){
                        css(area, {
                            position: 'absolute',
                            top: '0',
                            height: this.rect.height + 'px',
                            width: width,
                            zIndex: this.config.zIndex + 1 + len,
                            cursor: 'pointer',
                        });
                        if (extraProp && extraValue)
                            area.style[extraProp] = extraValue;
                    }.bind(this)
                };

                temp = (parseInt(width) - parseInt(size))*0.5 + 'px'
                arrow.style(arrow.left, 'left', temp);
                arrow.style(arrow.right, 'right', temp);
                arrow.left.innerHTML = indicator.arrow.appearance.left;
                arrow.right.innerHTML = indicator.arrow.appearance.right;

                container.arrow.style(container.arrow.left, 'left', '0');
                container.arrow.style(container.arrow.right, 'right', '0');

                container.arrow.left.appendChild(arrow.left);
                container.arrow.right.appendChild(arrow.right);
            }

            this.indicator = {
                arrow: {
                    container: {
                        left: container.arrow.left,
                        right: container.arrow.right,
                    },
                    arrow: {
                        left: arrow.left,
                        right: arrow.right,
                    }
                },
                dot: {
                    container: container.dot,
                    dot: dots,
                }
            };

            this.fragment.appendChild(container.dot);
            this.fragment.appendChild(container.arrow.left);
            this.fragment.appendChild(container.arrow.right);

            this.container.appendChild(this.fragment);
        },

        resize: function(){
            var i = 0,
                len = this.images.length,
                indicator = this.config.options.indicator;

            this.rect - this.container.getBoundingClientRect();

            for (; i < len; i++){
                css(this.images[i], {
                    backgroundSize: this.config.imageSize,
                    backgroundPosition: this.config.imagePosition,
                    width: this.rect.width + 'px',
                    height: this.rect.height + 'px',
                });
            }

            if (indicator.show === true){
                css(this.indicator.dot.container, 'left', (this.rect.width - (indicator.dot.size + indicator.dot.space)*this.images.length)*0.5 + 'px');
                css(this.indicator.arrow.container.left, {
                    left: '0',
                    height: this.rect.height + 'px'
                });
                css(this.indicator.arrow.container.right, {
                    right: '0',
                    height: this.rect.height + 'px'
                });
                css(this.indicator.arrow.arrow.left, 'top', (this.rect.height - indicator.arrow.size)*0.5 + 'px');
                css(this.indicator.arrow.arrow.right, 'top', (this.rect.height - indicator.arrow.size)*0.5 + 'px');
            }
        },

        slide: function(){
            var move = this.config.options.slide.move,
                stack = this.config.options.slide.stack,
                face = this.config.options.slide.direction,
                opac = this.config.options.slide.opacity,
                index = this.config.zIndex,
                images = this.images,
                spf = this.config.spf,
                intv = this.config.interval;

            var horizontal = face === 'left' || face === 'right',
                inward = move === 'in',
                turn = 0,
                direction = (face === 'left' || face === 'up') ? '-' : '',
                speed = this.config.speed,
                len = this.images.length;

            var current, next, last, progress, start, i;

            var loop = setTimeout(animate, intv);

            if (!stack)
                for (i = 0; i < len; i++)
                    css(images[i], 'opacity', i === 0 ? opac : 0);

            function animate(){
                clearTimeout(loop);

                current = images[turn];
                next = images[turn + 1] || images[0];
                last = images[turn - 1] || images[len - 1];
                progress = 0;

                start = setInterval(function(){
                    var movement, digress;
                    var x = progress + speed;

                    progress = x < 100 ? x : 100;
                    digress = parseFloat(direction + progress);
                    movement = ((stack ? inward : true) ? face === (horizontal ? 'left' : 'up') ? 100 : -100 : 0) + digress + '%';

                    if (stack){
                        if (horizontal)
                            (inward ? next : current).style.left = movement;
                        else
                            (inward ? next : current).style.top = movement;

                        if (inward)
                            css(next, 'zIndex', index + len);
                    } else {
                        if (horizontal){
                            css(current, 'left', digress + '%');
                            css(next, 'left', movement);
                        } else {
                            css(current, 'top', digress + '%');
                            css(next, 'top', movement);
                        }
                        css(next, 'opacity', opac);
                    }

                    if (progress === 100){
                        turn = turn < len - 1 ? turn + 1 : 0;
                        css(current, {
                            left: stack ? 0 : horizontal ? -(direction + 100) + '%' : 0,
                            top: stack ? 0 : !horizontal ? -(direction + 100) + '%' : 0,
                        });
                        if (stack){
                            css(current, 'zIndex', index);
                            for (i = 0; i < len; i++)
                                if (i !== images.indexOf(current))
                                    css(images[i], 'zIndex', parseInt(window.getComputedStyle(images[i]).zIndex) + (inward ? -1 : 1));
                        }
                        clearInterval(start);
                        loop = setTimeout(animate, intv);
                    }
                }, spf);
            }
        },

        fade: function(){
            var images = this.images,
                overlap = this.config.options.fade.overlap,
                opac = this.config.options.fade.opacity,
                index = this.config.zIndex,
                intv = this.config.interval,
                spf = this.config.spf,
                len = this.images.length,
                speed = this.config.speed;

            var i = 0,
                turn = 0,
                current,
                next,
                last,
                progress,
                start,
                indexing;

            var loop = setTimeout(animate, intv);

            for (; i < len; i++)
                css(images[i], 'opacity', i === 0 ? opac : 0);

            function animate(){
                clearTimeout(loop);

                current = images[turn];
                next = images[turn + 1] || images[0];
                last = images[turn - 1] || images[len - 1];
                progress = 0;
                indexing = true;

                start = setInterval(function(){
                    var x = progress + (speed/100)*opac;

                    progress = x < opac ? x : opac;

                    if (indexing){
                        indexing = false;
                        css(next, 'zIndex', index + len);
                        for (i = 0; i < len; i++)
                            if (i !== images.indexOf(next))
                                css(images[i], 'zIndex', parseInt(window.getComputedStyle(images[i]).zIndex) - 1);
                    }

                    css(next, 'opacity', progress);

                    if (progress === opac){
                        turn = turn < len - 1 ? turn + 1 : 0;
                        clearInterval(start);
                        loop = setTimeout(animate, intv);
                    }
                }, spf);
            }
        },

        init: function(){
            this.createImage();

            if (this.config.options.indicator.show === true)
                this.createIndicator();

            switch (this.config.mode){
                case 'slide': this.slide(); break;
                case 'fade': this.fade(); break;
                default: this.slide();
            }

            window.addEventListener('resize', this.resize.bind(this));
        }

    }

    window.Slidery = Slidery;

})();