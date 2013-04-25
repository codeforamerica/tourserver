class Tour < ActiveRecord::Base
  attr_accessible :difficulty, :name, :path, :tourtime, :interest_points_attributes, :tour_length

  set_rgeo_factory_for_column(:path,
                              RGeo::Geographic.spherical_factory(:srid => 3785))

  has_many :chapters
  has_many :interest_points, :through => :chapters

  def tour_length
    path.length
  end

  accepts_nested_attributes_for :interest_points
end
