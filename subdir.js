var subdir = {
    props: ['isSub', 'k', 'depth'],
    data: function() {
        return {
            rootFiles: [],
            hiddenFolders: {},
            shownFolders: {},
            files: {},
            dirs: [],
            plugins: {
                fileTypes: {
                    'plain script': {
                        icon: '',
                        content: 'print "hello world"'
                    },
                    'ui script': {
                        icon: '',
                        content: 'use ui.js;'
                    },
                    'lx script': {
                        icon: '',
                        content: 'use lx.js;'
                    },
                    'syntax file': {
                        icon: '',
                        content: '{$: { namespace: {  } }}'
                    }
                }
            },
            addFileOptionsShown: false
        }
    },
    watch: {
        hiddenFolders: function(val){
            localStorage['hiddenFolders'] = JSON.stringify(val)
        }
    },
    methods: {
        useFile: function(k) {
            bus.$emit('useFile', { name: k, content: this.files[k].content, project: this.files[k].project })
        },
        useTab: function(k) {
            bus.$emit('useTab', k)
        },
        addFile: function(k, content) {
            var file = { project: this.k, name: prompt('file name', ''), content: content }
            bus.$emit('addFile', file);
            Vue.set(this.files, file.name, file);
        },
        addDir: function(k, content) {
            var newname = prompt('enter a name'); 
            if(!newname) newname = this.makeid(3);
            k = k + '/' + newname

            bus.$emit('addDir', { path: k });
            this.dirs.push(k)
        },
        deleteFile: function(n) {
            bus.$emit('deleteFile', this.k + '/' + n);
            Vue.delete(this.files, n);
        },
        deleteDir: function(n) {
            bus.$emit('deleteDir', { path: n });
            Vue.set(this, 'files', {});
            Vue.set(this, 'dirs', []);
            Vue.set(this, 'k', '');
            this.$destroy();

            // remove the element from the DOM
            this.$el.parentNode.removeChild(this.$el);
            /*this.dirs.forEach((dir, i) => {
                alert(dir)
                if (dir == k) this.dirs.splice(i, 1);
            })*/
        },
        toggleFolderHidden: function(k){
            if(!this.hiddenFolders[k]) Vue.set(this.hiddenFolders, k, true);
            else Vue.delete(this.hiddenFolders, k);

            if(!this.shownFolders[k]) Vue.set(this.shownFolders, k, true);
            else Vue.delete(this.shownFolders, k);
        }
    },
    created: function() {
        var self = this;

        self.rootFiles = [];

        setTimeout(function() {
            for (var d in self.data) {
                console.log(d)
                self.getType('/' + self.k + '/' + d);
            }
        }, 1000);

        if(localStorage['hiddenFolders']) this.hiddenFolders = JSON.parse(localStorage['hiddenFolders'])

        bus.$on('saveContent', function(c) {
            Object.keys(self.files).forEach(function(k) {
                if (c.name == '/' + self.k + '/' + k) {
                    Vue.set(self.files[k], 'content', c.content);
                }
            })
        })

        fs.readdir('/' + self.k, {}, function(err, data) {
            if (err) return;

            self.rootFiles.push(data)

            if(!self.isSub) bus.$emit('rootFiles', self.rootFiles);

            data.forEach(function(file) {

                console.log('/' + self.k + '/' + file);

                fs.stat('/' + self.k + '/' + file, function(err, data) {

                    if (data.type == "dir") {
                        if (file.charAt(0) != '.') self.dirs.push(self.k + '/' + file);

                    } else {

                        fs.readFile('/' + self.k + '/' + file, function(err, data) {

                            if (!err) {
                                Vue.set(self.files, file, { path: '/' + self.k + '/' + file, name: file, content: new TextDecoder("utf-8").decode(data), project: self.k });
                            }
                        });

                    }
                })

            })

        })

    },
    template: `
         <div class="leto-block leto-ml-xs" > 
            <div>
            
            <div class="times-hover leto-text-white leto-pv-xxs leto-badge leto-border-none leto-bg-black leto-inline-block" v-if="isSub" style="background: none; font-size:14px;margin-bottom: 0px;margin-left: 0px;" >
                
                <span v-on:click="toggleFolderHidden(k)"><span class="fa fa-caret-right leto-mr-xxs" v-if="!shownFolders[k]"></span><span class="fa fa-caret-down leto-mr-xxs" v-if="shownFolders[k]"></span> {{k.split('/')[depth]}}</span>
                
                <!--div class="leto-ml-xs leto-color-grey leto-click times" v-on:click="addDir(k)"><i class="fa fa-folder"></i><sup>+</sup></div-->
                <div class=" leto-color-grey leto-click times" v-on:click="deleteDir(k)">&times;</div>
            </div>
          
             <div v-for="dir in dirs" class="ide_folder" v-if="shownFolders[k] || !isSub">
                 <subdir :k="dir" :isSub="true" :depth="dir.split('/').length-1" />
             </div>

            <div v-for="(file, t) in files" class="leto-block" v-if="shownFolders[k]  || !isSub" >
            <div class="times-hover leto-pv-xxs leto-badge leto-border-none leto-bg-black leto-inline-block">
                    
                    <div class="leto-text-white leto-pb-xxs leto-click leto-text-sm">
                    <span v-on:click="useFile(t);useTab(t)"><!--span class="fa fa-file leto-mr-xxs times-hide"></span--> {{t}} <span class="leto-text-light-black">{{file.content.substring(0, 18) || '(empty)'}}</span> <div class="leto-ml-xs leto-color-grey leto-click times" v-on:click="deleteFile(t)">&times;</div></span>
                    
                </div>
                </div>
            </div>
            
            <div v-if="shownFolders[k] || !isSub" class="circle-button leto-pv-xxs leto-text-white leto-border-none leto-mt-xxs  leto-ml-xs leto-bg-black" v-on:click="addFile(undefined, '')"><span class="super-grey-label"><span v-if="!addFileOptionsShown"><b>+</b></span><span v-if="addFileOptionsShown">&times;</span></span></div>
            
          </div>
          
        </div>
    `
}

Vue.component('subdir', subdir)