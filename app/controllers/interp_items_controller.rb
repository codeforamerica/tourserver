class InterpItemsController < ApplicationController
  # GET /interp_items
  # GET /interp_items.json
  def index
    if (params[:interest_point_id]) then
      @interp_items = InterpItem.joins(:interest_points).where('interest_points.id' => params[:interest_point_id])
    else
      @interp_items = InterpItem.all
    end

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @interp_items }
    end
  end

  # GET /interp_items/1
  # GET /interp_items/1.json
  def show
    @interp_item = InterpItem.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render :json => @interp_item, :include => :media_items }
    end
  end

  # GET /interp_items/new
  # GET /interp_items/new.json
  def new
    @interp_item = InterpItem.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @interp_item }
    end
  end

  # GET /interp_items/1/edit
  def edit
    @interp_item = InterpItem.find(params[:id])
  end

  # POST /interp_items
  # POST /interp_items.json
  def create
    @interp_item = InterpItem.new(params[:interp_item])

    respond_to do |format|
      if @interp_item.save
        format.html { redirect_to @interp_item, notice: 'Interp item was successfully created.' }
        format.json { render json: @interp_item, status: :created, location: @interp_item }
      else
        format.html { render action: "new" }
        format.json { render json: @interp_item.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /interp_items/1
  # PUT /interp_items/1.json
  def update
    @interp_item = InterpItem.find(params[:id])

    respond_to do |format|
      if @interp_item.update_attributes(params[:interp_item])
        format.html { redirect_to @interp_item, notice: 'Interp item was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @interp_item.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /interp_items/1
  # DELETE /interp_items/1.json
  def destroy
    @interp_item = InterpItem.find(params[:id])
    @interp_item.destroy

    respond_to do |format|
      format.html { redirect_to interp_items_url }
      format.json { head :no_content }
    end
  end
end
