/**
 * A panel implementing an HTML5 video player.
 * Use the `video` config option to add the file references.
 */
Ext.define('Ext.ux.VideoPanel', {
    extend: 'Ext.panel.Panel',
    xtype: 'videopanel',
    layout: 'fit',
    onRender: function() {
    
        this.callParent(arguments);
        
        // utility function to render the time value of the video
        var renderTime = function(time) {
            return Ext.util.Format.date(new Date(time * 1000), 'i:s');
        };

        // create the video tag
        this.videoEl = this.body.insertFirst({
            tag: 'video'
        });

        // ensure the video does not overflow its container
        this.videoEl.applyStyles({
            width: 'inherit',
            height: 'inherit'
        });

        // create the task that will update the current time
        this.timeUpdater = Ext.TaskManager.newTask({
            run: function() {

                // update the time text
                this.currentTime.setText(renderTime(this.videoEl.dom.currentTime));

                // update the slider position
                this.slider.setValue(this.videoEl.dom.currentTime * 100 / this.videoEl.dom.duration, false);
            },
            scope: this,
            interval: 500
        });

        // set the duration time when the video will be loaded
        this.videoEl.on('loadedmetadata', function() {
            this.duration.setText(renderTime(this.videoEl.dom.duration));
        }, this, { single: true });

        // when the video starts playing, start the time updater and change the button icon
        this.videoEl.on('playing', function() {
            this.timeUpdater.start();
            this.playButton.setIconCls('x-ux-video-control-pause');
        }, this);

        // when the video is paused, stop the time updater and change the button icon
        this.videoEl.on('pause', function() {
            this.timeUpdater.stop();
            this.playButton.setIconCls('x-ux-video-control-play');
        }, this);

        // when the video is ready to start playing, enable the controls
        this.videoEl.on('canplay', function() {
            this.getDockedItems('toolbar[dock="bottom"]')[0].enable();
        }, this, { single: true });

        // we need to save a reference to the video element for the tipText() method of the slider
        var videoEl = this.videoEl;

        // create the controls toolbar
        this.addDocked({
            xtype: 'toolbar',
            dock: 'bottom',
            layoutConfig: { autoWidth: false },
            disabled: true,
            items: [
                {
                    itemId: 'play',
                    xtype: 'button',
                    iconCls: 'x-ux-video-control-play',
                    handler: function() {

                        if (this.videoEl.dom.paused) {
                            this.videoEl.dom.play();
                        }
                        else {
                            this.videoEl.dom.pause();
                        }
                    },
                    scope: this
                },
                {
                    itemId: 'slider',
                    xtype: 'slider',
                    minValue: 0,
                    maxValue: 100,
                    isFill: true,
                    flex: 1,
                    tipText: function(thumb) {
                        return renderTime(thumb.value * videoEl.dom.duration / 100);
                    },
                    listeners: {
                        dragstart: {
                            fn: function() {
                                this.videoEl.playingBeforeDrag = !(this.videoEl.dom.paused || this.videoEl.dom.ended);
                                this.videoEl.dom.pause();
                            },
                            scope: this
                        },
                        dragend: {
                            fn: function() {
                                this.videoEl.dom.currentTime = this.slider.getValue() * this.videoEl.dom.duration / 100;
                                if (this.videoEl.playingBeforeDrag) {
                                    this.videoEl.dom.play();
                                    this.videoEl.playingBeforeDrag = false;
                                }
                            },
                            scope: this
                        }
                    }
                },
                {
                    itemId: 'currentTime',
                    xtype: 'tbtext',
                    text: '00:00'
                },
                {
                    xtype: 'tbtext',
                    text: '/'
                },
                {
                    itemId: 'duration',
                    xtype: 'tbtext',
                    text: '00:00'
                }
            ]
        });

        // save references to the elements of the controls toolbar
        this.playButton = this.getDockedItems('toolbar[dock="bottom"]')[0].items.get('play');
        this.slider = this.getDockedItems('toolbar[dock="bottom"]')[0].items.get('slider');
        this.currentTime = this.getDockedItems('toolbar[dock="bottom"]')[0].items.get('currentTime');
        this.duration = this.getDockedItems('toolbar[dock="bottom"]')[0].items.get('duration');

        // add ech video to the list of sources for this video element
        Ext.each(this.video, function(url) {
            this.videoEl.createChild({
                tag: 'source',
                src: url
            });
        }, this);
    }
});
