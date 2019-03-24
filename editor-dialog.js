function html(strings) { 
    // The default function just concatenates the parts into a single string.
    return strings.join('');
}

Vue.component('editor-dialog', {
    template: html`

        <div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span
                                aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title" id="myModalLabel">Event details</h4>
                    </div>
                    <div class="modal-body"
                    style="padding-bottom: 0">
        
                        <form class="form-horizontal">

                            <div class="form-group">
                                <label class="col-xs-3 control-label">Type</label>
                                <div class="col-xs-6">
                                    <select class="form-control" v-model="dbitem.type">
                                        <option v-for="(value, key) in eventTypes"
                                                v-bind:value="key">{{ value }} {{ key }}</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="col-xs-3 control-label">Name</label>
                                <div class="col-xs-9">
                                    <input type="text" class="form-control" v-model="dbitem.name">
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="col-xs-3 control-label">Location</label>
                                <div class="col-xs-9">
                                    <input type="text" class="form-control" v-model="dbitem.location">
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="col-xs-3 control-label">Date</label>
                                <div class="col-xs-5">
                                    <bootstrap-datepicker v-model="dbitem.date"></bootstrap-datepicker>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="col-xs-3 control-label">Status</label>
                                <div class="col-xs-7">
                                    <select class="form-control" v-model="dbitem.status">
                                        <option v-for="(value, key) in statusList"
                                                v-bind:value="key">{{ value }} {{ key }}</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="col-xs-3 control-label">Link</label>
                                <div class="col-xs-9">
                                    <div v-bind:class="{ 'input-group': !!dbitem.link }">
                                        <input type="text" class="form-control" v-model="dbitem.link">
        
                                        <a v-show="!!dbitem.link"
                                            v-bind:href="dbitem.link"
                                            class="input-group-addon emoji"
                                            target="_blank"><span class="glyphicon glyphicon-new-window"></span></a>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="col-xs-3 control-label">Notes</label>
                                <div class="col-xs-9">
                                    <textarea class="form-control" v-model="dbitem.notes"></textarea>
                                </div>
                            </div>
                        </form>

                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                        <button type="button" 
                                class="btn btn-primary"
                                v-on:click="save">Save changes</button>
                    </div>
                </div>
            </div>
        </div>

    `,
    props: {
        'eventTypes': Object,
        'statusList': Object
    },
    data: function() {
        return {
            dbitem: this.new_item()
        }
    },
    methods: {
        new_item: function () {
            return {
                id: -1, // will be set when saved
                type: '',
                name: '',
                location: '',
                date: null,
                status: '',
                link: '',
                notes: ''
            };
        },
        openDialog: function (item) { // called by parent via $refs
            if (!item) {
                // create new item
                this.dbitem = this.new_item();
            } else {
                // edit existing item
                this.dbitem = item;
            }
            $('#myModal').modal('show');
        },
        save: function () {
            this.$emit('save', this.dbitem);
            $('#myModal').modal('hide');
        }
    }
});