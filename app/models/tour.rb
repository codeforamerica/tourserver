class Tour < ActiveRecord::Base
  attr_accessible :difficulty, :name, :path, :tourtime, :interest_points_attributes, 
    :tour_length, :description, :cover_image, :cover_image_file_name, :fullitem

  has_attached_file :cover_image

  set_rgeo_factory_for_column(:path,
                              RGeo::Geographic.spherical_factory(:srid => 3785))

  has_many :chapters
  has_many :interest_points, :through => :chapters, :order => 'chapters.position';

  def tour_length
    if path
      path.length
    end
  end

  def fullitem
    cover_image.url
  end
  
  accepts_nested_attributes_for :interest_points


end
