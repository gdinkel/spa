/* eslint-disable */
(function(){
  var app = {
    isLoading: true,
    spinner: $('.loader'),
    container: $('.container-fluid'),
    itemList: $('.sortable-items'),
    visiblelistElements: {},
    jsonItems: [],
    listElementTemplate: $('.listElementTemplate'),
    form: $('#item-description-create'),
    imageFile: $("input[type='file']"),
    inputText: $("input[type='text']"),
    inputHidden: $("input[type='hidden']"),
    buttonReset: $("input[type='reset']"),
    isImage: false,
    isValidImage: false,
    isValidText: false,
    pill: $('.badge-pill'),
    counter: 0,
    editDialog: $('.dialog-container'),
    isEdit: false
  }
  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/
  /** Toggles the visibility of the dialog. */
  app.toggleEditDialog = function(visible) {
    if (visible) {
      app.editDialog.addClass('dialog-container--visible');
    } else {
      app.editDialog.removeClass('dialog-container--visible');
    }
  };
  /** Updates a item listElement. If the listElement
   * doesn't already exist, it's cloned from the template.
   */
  app.updateItemElement = function(data) {
    var listElement = app.visiblelistElements[data._id];
    if (!listElement) {
      listElement = app.listElementTemplate.clone(true,true);
      listElement.removeClass('listElementTemplate');
      listElement.removeAttr('hidden');
      app.itemList.append(listElement);
      app.visiblelistElements[data._id] = listElement;
    }
    app.pill.text(app.increase());
    listElement.prepend(data.description);
    listElement.prepend(`<img src="/images/${data.image}" class="img" />`);
    listElement.attr('data-_id',data._id)
    listElement.attr('data-name',data.description)
    listElement.find('.btn-warning').bind('click', data , app.editItem)
    listElement.find('.btn-danger').bind('click', data , app.deleteItem)
  };
  /** Increase the list item counter */
  app.increase = function(){
    return ++app.counter;
  }
  /** Decrease the list item counter */
  app.decrease = function(){
    return app.counter--;
  }
  /** Add the re order functionality to the list */
  app.sortable = function(){
    var list = app.itemList.sortable({
      group: 'sortable-items',
      delay: 500,
      onDrop: function ($item, container, _super) {
        app.jsonItems = list.sortable("serialize").get();
        app.saveOrderList();
        _super($item, container);
      }
    });
  }
  /** Set up and show the add new item dialog box form */
  app.addItem = function(e){
    app.editDialog.find('.bd-callout').removeClass('bd-callout-info');
    app.editDialog.find('.bd-callout').removeClass('bd-callout-warning');
    app.editDialog.find('.bd-callout').addClass('bd-callout-info');
    app.editDialog.find('h4').text('Add new Item');
    app.toggleEditDialog(true);
  }
  /** Set up and show the edit item dialog box form */
  app.editItem = function(e){
    var item = e.data;
    app.isEdit = true;
    app.inputText.val(item.description);
    app.inputHidden.val(item._id);
    app.editDialog.find('.bd-callout').removeClass('bd-callout-info');
    app.editDialog.find('.bd-callout').removeClass('bd-callout-warning');
    app.editDialog.find('.bd-callout').addClass('bd-callout-warning');
    app.editDialog.find('h4').text('Edit Item');
    app.toggleEditDialog(true);
  }
  /** Delete an item from the list */
  app.deleteItem = function(e){
    var item = e.data;
    if(confirm('Are your sure?')){
      app.delete(item);
    }
  }
  /** Do all necesary checks for the image to upload. If exist, if has the
   * necesary width and height
   */
  app.checkImage = function(){
    var _URL = window.URL || window.webkitURL;
    var file, img;
    img = new Image();
    img.onerror = function() {
      alert( "not a valid file: " + file.type);
    };
    if(this.files){
      file = this.files[0]
      app.isImage = true;
      app.imageFile = this.files[0];
      img.src = _URL.createObjectURL(file);
    } else {
      if(!app.isEdit) alert('There no image attached');
      return;
    }
    if ((file = this.files[0])) {
      img = new Image();
      img.onload = function() {
        if (this.width === 320 && this.height === 320) {
          console.log('imagen correcta');
          app.isValidImage = true;
        } else {
          app.isValidImage = false;
          alert('The image must be 320px width & heigth');
          return;
        }
      };
      img.src = _URL.createObjectURL(file);
    }
  }
  /** Do all necesary checks for the description text */
  app.checkText = function(){
    if($("input[type='text']").val().length > 0){
      app.isValidText = true;
    }
  }
  /** Checks if all data is ok and call the necesary methods to modify
   * the model
   */
  app.checkFormData = function(event){
    event.preventDefault();
    if(app.isEdit){
      app.checkImage();
      app.checkText();
      console.log('app.isImage: ',app.isImage)
      console.log('app.isValidText: ',app.isValidText)
      console.log('app.isValidImage: ',app.isValidImage)
      if(app.isImage){
        if(app.isValidImage && app.isValidText){
          app.updateFormData();
        } else {
          alert('Image size or text are wrong!');
          return;
        }
      } else if(app.isValidText){
        app.updateFormData();
      } else {
        alert('Input text is empty');
        return;
      }
    } else if (app.isValidImage && app.isValidText){
      app.saveFormData();
    } else {
      alert('Image size or text are wrong!');
      return;
    }
  }
  /** Close the dialog form */
  app.closeForm = function(event){
    app.toggleEditDialog(false);
  }
  /** Reset all the initial parameters of the app and load the data */
  app.reload = function(){
    app.visiblelistElements = {};
    app.jsonItems = [];
    app.isLoading = true;
    app.isImage = false;
    app.isValidImage = false;
    app.isValidText = false;
    app.counter = 0;
    app.isEdit = false;
    app.itemList.empty();
    app.getItems();
    app.form[0].reset();
    app.toggleEditDialog(false);
  }
  /*****************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/
  /** Bring the item list from the database */
  app.getItems = function(){
    $.getJSON( '/api/items', function( data ) {
      $.each( data, function( index, item ) {
        app.updateItemElement(item)
      });
      app.sortable();
    });
  }
  /** Save the form data to the database */
  app.saveFormData = function(){
    var data = new FormData();
    data.append('image', app.imageFile);
    data.append('description', app.inputText.val());
    var options = {
      url: '/api/items',
      data: data,
      cache: false,
      contentType: false,
      processData: false,
      method: 'POST',
      success: function(data){
        app.reload();
      }
    }
    jQuery.ajax(options);
  }
  /** Save the re arrangement of the list items */
  app.saveOrderList = function(){
    $.when(jQuery.ajax({
      method: 'PUT',
      dataType: 'json',
      contentType: 'application/json',
      url: `/api/items`,
      data: JSON.stringify({ items: app.jsonItems[0].map((item,index) =>{
        return Object.assign({ order: index }, item);
      }) }),
      cache: false,
      success: function(data){
        console.log(data);
      }
    })
    ).then(function() {
      app.reload();
    });
  }
  /** Upload the image to the server */
  app.updateImage = function(){
    return new Promise(function(resolve, reject){
      var data = new FormData();
      data.append('image', app.imageFile);
      var options = {
        url: '/api/upload',
        data: data,
        cache: false,
        contentType: false,
        processData: false,
        method: 'POST',
        success: function(filename){
          resolve(filename);
        }
      }
      return jQuery.ajax(options);
    });
  }
  //** Update the item list data */
  app.updateFormData = function(){
    if(app.isImage) {
      app.updateImage().then(function(data){
        var options = {
          method: 'PUT',
          dataType: 'json',
          url: `/api/items/${app.inputHidden.val()}`,
          data: {
            description: app.inputText.val(),
            image: data
          },
          cache: false,
          success: function(data){
            app.reload();
          }
        }
        jQuery.ajax(options);
      });
    } else {
      var options = {
        method: 'PUT',
        dataType: 'json',
        url: `/api/items/${app.inputHidden.val()}`,
        data: {
          description: app.inputText.val()
        },
        cache: false,
        success: function(data){
          app.reload();
        }
      }
      jQuery.ajax(options);
    }
  }
  /** Delete an item from the database */
  app.delete = function(item){
    jQuery.ajax({
      method: 'DELETE',
      dataType: 'json',
      url: `/api/items/${item._id}`,
      cache: false,
      success: function(data){
        console.log(data);
        app.reload();
        app.pill.text(app.decrease())
      }
    })
  }
  /*****************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/
  $('#item-description-create').bind('submit',{}, app.checkFormData);
  $("input[type='file']").change(app.checkImage);
  $("input[type='text']").on('keyup',app.checkText);
  $("button[type='reset']").click(app.closeForm);
  $('#addNewItem').click(app.addItem)
  /*****************************************************************************
   *
   * Code required to start the app
   *
   ****************************************************************************/
  app.start = function(){
    app.getItems();
    if (app.isLoading) {
      app.spinner.attr('hidden', true);
      app.container.removeAttr('hidden');
      app.isLoading = false;
    }
  }
  app.start();
})();
