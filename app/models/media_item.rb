class MediaItem < ActiveRecord::Base
  attr_accessible :mimetype, :name, :position, :item, :interp_item_id, :fullitem
  has_attached_file :item

  belongs_to :interp_item
  acts_as_list :scope => :interp_item

  def fullitem
    item.url
  end

end
