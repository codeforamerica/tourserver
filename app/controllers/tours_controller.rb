

class ToursController < ApplicationController

  before_filter :convert_wkt, :only => [:create, :update]

  def convert_wkt
    if (params[:tour])
      if (params[:tour][:path])
        parser = RGeo::WKRep::WKTParser.new(nil, :support_ewkt => true)
        params[:tour][:path] = parser.parse(params[:tour][:path])
      end
      params[:tour].delete(:pathpoints)
    end


    # TODO: need to refactor the need for this away.
    # removing any media_items from submission because we submit them 
    # separately.
    # if (!(params[:tour][:interest_points_attributes]).nil?) then
    #   params[:tour][:interest_points_attributes].each do |ip|
    #     logger.info(ip.inspect)
    #     if (!ip[:interp_items_attributes].nil?) then
    #       ip[:interp_items_attributes].each do |ii|
    #         logger.info(ii.inspect)
    #         if (!ii[:media_items_attributes].nil?) then
    #           ii.delete(:media_items)
    #         end
    #       end
    #     end
    #   end
    # end
  end 


  # GET /tours
  # GET /tours.json
  def index
    @tours = Tour.all
    @tours.each do |tour|
      tour["fullitem"] = tour.cover_image.url
    end
    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @tours, 
        :include => {:chapters => {:include => :interest_point}},
        :methods => :tour_length
      }
    end
  end

  # GET /tours/1
  # GET /tours/1.json
  def show
    @tour = Tour.find(params[:id])

    @show_tour = @tour.clone
    @show_tour["fullitem"] = @show_tour.cover_image.url
    respond_to do |format|
      format.html # show.html.erb
      format.json { render :json => @show_tour, 
        :include => {:interest_points => {:include => {:interp_items => {:include => :media_items} } }},
        :methods => :tour_length
      }
    end
  end

  # GET /tours/new
  # GET /tours/new.json
  def new
    @tour = Tour.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @tour }
    end
  end

  # GET /tours/1/edit
  def edit
    @tour = Tour.find(params[:id])
  end

  # POST /tours
  # POST /tours.json
  def create
    @tour = Tour.new(params[:tour])

    respond_to do |format|
      if @tour.save
        format.html { redirect_to @tour, notice: 'Tour was successfully created.' }
        format.json { render json: @tour, status: :created, location: @tour }
      else
        format.html { render action: "new" }
        format.json { render json: @tour.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /tours/1
  # PUT /tours/1.json
  def update
    @tour = Tour.find(params[:id])

    respond_to do |format|
      if @tour.update_attributes(params[:tour])
        format.html { redirect_to @tour, notice: 'Tour was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @tour.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /tours/1
  # DELETE /tours/1.json
  def destroy
    @tour = Tour.find(params[:id])
    @tour.destroy

    respond_to do |format|
      format.html { redirect_to tours_url }
      format.json { head :no_content }
    end
  end
end
