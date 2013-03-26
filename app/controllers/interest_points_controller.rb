class InterestPointsController < ApplicationController

  before_filter :convert_wkt, :only => [:create, :update]

  def convert_wkt
    parser = RGeo::WKRep::WKTParser.new(nil, :support_ewkt => true)
    logger.info(params[:interest_point][:location])
    params[:interest_point][:location] = parser.parse(params[:interest_point][:location])
    logger.info(params)
  end

  # GET /interest_points
  # GET /interest_points.json
  def index
    @interest_points = InterestPoint.all

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @interest_points }
    end
  end

  # GET /interest_points/1
  # GET /interest_points/1.json
  def show
    @interest_point = InterestPoint.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @interest_point }
    end
  end

  # GET /interest_points/new
  # GET /interest_points/new.json
  def new
    @interest_point = InterestPoint.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @interest_point }
    end
  end

  # GET /interest_points/1/edit
  def edit
    @interest_point = InterestPoint.find(params[:id])
  end

  # POST /interest_points
  # POST /interest_points.json
  def create
    @interest_point = InterestPoint.new(params[:interest_point])

    respond_to do |format|
      if @interest_point.save
        format.html { redirect_to @interest_point, notice: 'Interest point was successfully created.' }
        format.json { render json: @interest_point, status: :created, location: @interest_point }
      else
        format.html { render action: "new" }
        format.json { render json: @interest_point.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /interest_points/1
  # PUT /interest_points/1.json
  def update
    @interest_point = InterestPoint.find(params[:id])

    respond_to do |format|
      if @interest_point.update_attributes(params[:interest_point])
        format.html { redirect_to @interest_point, notice: 'Interest point was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @interest_point.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /interest_points/1
  # DELETE /interest_points/1.json
  def destroy
    @interest_point = InterestPoint.find(params[:id])
    @interest_point.destroy

    respond_to do |format|
      format.html { redirect_to interest_points_url }
      format.json { head :no_content }
    end
  end
end
